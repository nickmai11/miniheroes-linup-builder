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
      newDeviceToken,
      findRegisteredDevice,
      redeemInvitationCode,
      hashInvitationSecret,
    } = loadTypeScript("src/lib/invitations.ts", {
      "server-only": {},
      "@/db": { db, schema },
    });
    const codes = [];
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
