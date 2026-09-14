import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { loadTypeScript } from "./load-typescript.mjs";

// Explicit opt-in to a migrated, disposable local database. Never use DATABASE_URL.
const testUrl = process.env.INVITATION_TEST_DATABASE_URL;

test(
  "invitation redemption is single-use, atomic, retryable, and stores only hashes",
  { skip: !testUrl },
  async () => {
    const target = new URL(testUrl);
    assert.equal(target.hostname, "127.0.0.1");
    assert.equal(target.port, "55441");
    assert.equal(target.username, "invitation_test");
    assert.equal(target.pathname, "/invitation_access_test");
    const sql = postgres(testUrl, { prepare: false, max: 8 });
    const schema = loadTypeScript("src/db/schema.ts");
    let failRegistration = false;
    const db = drizzle(sql, {
      schema,
      logger: {
        logQuery(query) {
          if (
            failRegistration &&
            query.startsWith('insert into "registered_devices"')
          )
            throw new Error("Simulated registration failure");
        },
      },
    });
    const {
      generateInvitationCode,
      newDeviceToken: createDeviceToken,
      findRegisteredDevice,
      redeemInvitationCode,
      hashInvitationSecret,
    } = loadTypeScript("src/lib/invitations.ts", {
      "server-only": {},
      "@/db": { db, schema },
    });
    const codes = [];
    const tokens = [];
    const newDeviceToken = () => {
      const token = createDeviceToken();
      tokens.push(token);
      return token;
    };
    const generate = async () => {
      const code = await generateInvitationCode();
      codes.push(code);
      return code;
    };
    const invitation = async (code) =>
      (
        await db
          .select()
          .from(schema.invitationCodes)
          .where(
            eq(
              schema.invitationCodes.codeHash,
              hashInvitationSecret(code.replaceAll("-", "")),
            ),
          )
      )[0];
    try {
      const legacyCode = await generate();
      const legacyToken = newDeviceToken();
      await db.insert(schema.registeredDevices).values({
        tokenHash: hashInvitationSecret(legacyToken),
        invitationId: (await invitation(legacyCode)).id,
      });
      assert.equal(
        (await findRegisteredDevice(legacyToken)).fullAccess,
        true,
        "Older deployments can still register browsers after the migration",
      );
      const code = await generate();
      assert.match(code, /^[A-F0-9]{4}(?:-[A-F0-9]{4}){5}$/);
      const deviceTokens = Array.from({ length: 6 }, newDeviceToken);
      assert.equal(await findRegisteredDevice(deviceTokens[0]), null);
      const claims = await Promise.all(
        deviceTokens.map((token) => redeemInvitationCode(code, token)),
      );
      assert.equal(
        claims.filter(Boolean).length,
        1,
        "Only one device wins simultaneous redemption",
      );
      const winner = deviceTokens[claims.indexOf(true)];
      assert.ok(await findRegisteredDevice(winner));
      assert.equal(
        await redeemInvitationCode(code, winner),
        true,
        "A lost response can be retried by its original device",
      );
      assert.equal(await redeemInvitationCode(code, newDeviceToken()), false);
      assert.equal(
        await redeemInvitationCode("invalid", winner),
        true,
        "Registered devices keep access",
      );
      const unused = await generate();
      assert.equal(await redeemInvitationCode(unused, winner), true);
      assert.equal(
        (await invitation(unused)).usedAt,
        null,
        "Registered devices do not consume another code",
      );
      const [stored] = await db
        .select()
        .from(schema.registeredDevices)
        .where(
          eq(
            schema.registeredDevices.invitationId,
            (await invitation(code)).id,
          ),
        );
      assert.equal(stored.tokenHash, hashInvitationSecret(winner));
      assert.doesNotMatch(JSON.stringify(stored), new RegExp(winner));
      assert.notEqual(
        (await invitation(code)).codeHash,
        code.replaceAll("-", ""),
      );

      const retryCode = await generate();
      const retryToken = newDeviceToken();
      failRegistration = true;
      await assert.rejects(redeemInvitationCode(retryCode, retryToken));
      failRegistration = false;
      assert.equal(
        (await invitation(retryCode)).usedAt,
        null,
        "Failed registration rolls back the code claim",
      );
      assert.equal(await findRegisteredDevice(retryToken), null);
      assert.equal(
        await redeemInvitationCode(retryCode.toLowerCase(), retryToken),
        true,
      );

      const sharedToken = newDeviceToken();
      const simultaneousCodes = await Promise.all(
        Array.from({ length: 4 }, generate),
      );
      assert.ok(
        (
          await Promise.all(
            simultaneousCodes.map((value) =>
              redeemInvitationCode(value, sharedToken),
            ),
          )
        ).every(Boolean),
      );
      const rows = await Promise.all(simultaneousCodes.map(invitation));
      assert.equal(
        rows.filter((row) => row.usedAt !== null).length,
        1,
        "One browser consumes only one code even across simultaneous tabs",
      );
    } finally {
      failRegistration = false;
      for (const token of tokens) {
        await db
          .delete(schema.registeredDevices)
          .where(
            eq(schema.registeredDevices.tokenHash, hashInvitationSecret(token)),
          );
      }
      for (const code of codes) {
        await db
          .delete(schema.invitationCodes)
          .where(
            eq(
              schema.invitationCodes.codeHash,
              hashInvitationSecret(code.replaceAll("-", "")),
            ),
          );
      }
      await sql.end();
    }
  },
);

test(
  "lineup invitations accumulate per device without exposing other lineups, survive deletion and transfer, and upgrade to full access",
  { skip: !testUrl },
  async () => {
    const target = new URL(testUrl);
    assert.equal(target.origin, "null");
    assert.equal(target.hostname, "127.0.0.1");
    assert.equal(target.port, "55441");
    assert.equal(target.username, "invitation_test");
    assert.equal(target.pathname, "/invitation_access_test");
    const sql = postgres(testUrl, { prepare: false, max: 8 });
    const schema = loadTypeScript("src/db/schema.ts");
    let failGrant = false;
    const db = drizzle(sql, {
      schema,
      logger: {
        logQuery(query) {
          if (
            failGrant &&
            query.startsWith('insert into "invitation_redemptions"')
          )
            throw new Error("Simulated grant failure");
        },
      },
    });
    const invitations = loadTypeScript("src/lib/invitations.ts", {
      "@/db": { db, schema },
    });
    const { getAllLineups } = loadTypeScript("src/lib/lineups.ts", {
      "@/db": { db, schema },
      "./heroes": {
        syncSeededHeroDetails: async () => {},
        divinitiesByHeroIds: async () => new Map(),
      },
    });
    const lineups = await db
      .insert(schema.lineups)
      .values([
        { name: "IC Lineup A" },
        { name: "IC Lineup B" },
        { name: "IC Private C" },
      ])
      .returning();
    const codes = [];
    const tokens = [];
    const generate = async (lineupId = null) => {
      const code = await invitations.generateInvitationCode(lineupId);
      codes.push(code);
      return code;
    };
    const newToken = () => {
      const token = invitations.newDeviceToken();
      tokens.push(token);
      return token;
    };
    const row = async (code) =>
      (
        await db
          .select()
          .from(schema.invitationCodes)
          .where(
            eq(
              schema.invitationCodes.codeHash,
              invitations.hashInvitationSecret(code.replaceAll("-", "")),
            ),
          )
      )[0];
    try {
      const token = newToken();
      const a = await generate(lineups[0].id);
      const b = await generate(lineups[1].id);
      assert.ok(await invitations.redeemInvitationCode(a, token));
      let device = await invitations.findRegisteredDevice(token);
      const deviceId = device.id;
      assert.equal(device.fullAccess, false);
      assert.deepEqual(device.lineupIds, [lineups[0].id]);
      assert.deepEqual(
        (await getAllLineups(device.lineupIds)).map((lineup) => lineup.id),
        [lineups[0].id],
      );
      assert.ok(await invitations.redeemInvitationCode(b, token));
      assert.ok(
        await invitations.redeemInvitationCode(b, token),
        "retry succeeds for the same browser",
      );
      device = await invitations.findRegisteredDevice(token);
      assert.equal(device.id, deviceId);
      assert.deepEqual(
        device.lineupIds.toSorted(),
        lineups
          .slice(0, 2)
          .map((lineup) => lineup.id)
          .toSorted(),
      );
      assert.deepEqual(
        (await getAllLineups(device.lineupIds))
          .map((lineup) => lineup.id)
          .toSorted(),
        device.lineupIds.toSorted(),
      );
      assert.deepEqual(await getAllLineups([]), []);
      assert.equal(
        await invitations.redeemInvitationCode("invalid", token),
        false,
      );
      assert.deepEqual(await invitations.findRegisteredDevice(token), device);
      assert.equal(
        await invitations.redeemInvitationCode(a, newToken()),
        false,
      );

      const duplicate = await generate(lineups[0].id);
      assert.ok(await invitations.redeemInvitationCode(duplicate, token));
      assert.equal(
        (await row(duplicate)).usedAt,
        null,
        "an already granted lineup does not consume another code",
      );

      const c = await generate(lineups[2].id);
      failGrant = true;
      await assert.rejects(invitations.redeemInvitationCode(c, token));
      failGrant = false;
      assert.equal((await row(c)).usedAt, null);
      assert.deepEqual(await invitations.findRegisteredDevice(token), device);

      const concurrentToken = newToken();
      const concurrentCodes = await Promise.all(
        lineups.map((lineup) => generate(lineup.id)),
      );
      assert.ok(
        (
          await Promise.all(
            concurrentCodes.map((code) =>
              invitations.redeemInvitationCode(code, concurrentToken),
            ),
          )
        ).every(Boolean),
      );
      assert.equal(
        (await invitations.findRegisteredDevice(concurrentToken)).lineupIds
          .length,
        3,
        "simultaneous first registration collects every distinct grant",
      );
      const contestedCode = await generate(lineups[2].id);
      const claims = await Promise.all(
        Array.from({ length: 6 }, () =>
          invitations.redeemInvitationCode(contestedCode, newToken()),
        ),
      );
      assert.equal(claims.filter(Boolean).length, 1);

      const moved = await invitations.rotateDeviceToken(token);
      tokens.push(moved);
      assert.equal(await invitations.findRegisteredDevice(token), null);
      assert.deepEqual(await invitations.findRegisteredDevice(moved), device);
      await db
        .delete(schema.lineups)
        .where(eq(schema.lineups.id, lineups[0].id));
      device = await invitations.findRegisteredDevice(moved);
      assert.equal(
        device.id,
        deviceId,
        "deleting the first invited lineup does not delete the device",
      );
      assert.deepEqual(device.lineupIds, [lineups[1].id]);
      assert.equal(
        device.fullAccess,
        false,
        "a deleted lineup can never become a full-library invitation",
      );
      assert.equal(await row(a), undefined);
      const full = await generate();
      assert.ok(await invitations.redeemInvitationCode(full, moved));
      assert.equal(
        (await invitations.findRegisteredDevice(moved)).fullAccess,
        true,
      );
      assert.ok(await invitations.redeemInvitationCode("invalid", moved));
    } finally {
      failGrant = false;
      for (const token of tokens)
        await db
          .delete(schema.registeredDevices)
          .where(
            eq(
              schema.registeredDevices.tokenHash,
              invitations.hashInvitationSecret(token),
            ),
          );
      for (const code of codes)
        await db
          .delete(schema.invitationCodes)
          .where(
            eq(
              schema.invitationCodes.codeHash,
              invitations.hashInvitationSecret(code.replaceAll("-", "")),
            ),
          );
      for (const lineup of lineups)
        await db.delete(schema.lineups).where(eq(schema.lineups.id, lineup.id));
      await sql.end();
    }
  },
);

test(
  "migration 0026 preserves existing full-library registrations and unused codes",
  { skip: !testUrl },
  async () => {
    const { readFile } = await import("node:fs/promises");
    const target = new URL(testUrl);
    assert.equal(target.hostname, "127.0.0.1");
    assert.equal(target.port, "55441");
    assert.equal(target.username, "invitation_test");
    assert.equal(target.pathname, "/invitation_access_test");
    const sql = postgres(testUrl, { prepare: false, max: 1 });
    const rollback = new Error("rollback fixture schema");
    try {
      await assert.rejects(
        sql.begin(async (tx) => {
          await tx`CREATE SCHEMA invitation_migration_fixture`;
          await tx`SET LOCAL search_path TO invitation_migration_fixture`;
          await tx`CREATE TABLE lineups (id integer PRIMARY KEY)`;
          const old = await readFile(
            new URL("../drizzle/0019_invitation_access.sql", import.meta.url),
            "utf8",
          );
          await tx.unsafe(
            old.replaceAll('"public".', '"invitation_migration_fixture".'),
          );
          await tx`INSERT INTO invitation_codes (code_hash, used_at) VALUES ('existing-code-hash', now()), ('unused-code-hash', null)`;
          await tx`INSERT INTO registered_devices (token_hash, invitation_id) VALUES ('existing-token-hash', 1)`;
          const migration = await readFile(
            new URL("../drizzle/0026_lineup_invitations.sql", import.meta.url),
            "utf8",
          );
          await tx.unsafe(
            migration.replaceAll(
              '"public".',
              '"invitation_migration_fixture".',
            ),
          );
          const grants =
            await tx`SELECT r.device_id, i.code_hash, i.lineup_id FROM invitation_redemptions r JOIN invitation_codes i ON i.id = r.invitation_id`;
          assert.deepEqual(
            [...grants],
            [
              {
                device_id: 1,
                code_hash: "existing-code-hash",
                lineup_id: null,
              },
            ],
          );
          const unused =
            await tx`SELECT used_at, lineup_id FROM invitation_codes WHERE code_hash = 'unused-code-hash'`;
          assert.deepEqual([...unused], [{ used_at: null, lineup_id: null }]);
          const [table] =
            await tx`SELECT relrowsecurity FROM pg_class WHERE oid = 'invitation_redemptions'::regclass`;
          assert.equal(table.relrowsecurity, true);
          const [grant] =
            await tx`SELECT has_table_privilege('lineup_app', 'invitation_redemptions', 'INSERT') AS allowed`;
          assert.equal(grant.allowed, true);
          throw rollback;
        }),
        (error) => error === rollback,
      );
    } finally {
      await sql.end();
    }
  },
);
