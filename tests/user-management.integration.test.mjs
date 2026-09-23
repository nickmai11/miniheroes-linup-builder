import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import { loadTypeScript } from "./load-typescript.mjs";

const testUrl = process.env.USERS_TEST_DATABASE_URL;
test(
  "admins list and rename users; revocation invalidates tokens, keeps invitations spent, and removes personal data",
  { skip: !testUrl },
  async () => {
    assert.equal(testUrl, "postgres://vote_test@127.0.0.1:55443/votes_test");
    const client = postgres(testUrl, { prepare: false });
    const schema = loadTypeScript("src/db/schema.ts");
    const db = drizzle(client, { schema });
    let adminId = "12345678-1234-4234-8234-123456789012";
    const overrides = {
      "@/db": { db, schema },
      "@/lib/admin-access": { getAdminId: async () => adminId },
    };
    const service = loadTypeScript("src/lib/user-management.ts", overrides);
    const invitations = loadTypeScript("src/lib/invitations.ts", overrides);
    const prefix = `users-${Date.now()}`;
    const deviceIds = [],
      invitationIds = [],
      keys = [`admin:${adminId}`];
    let lineup;
    async function invite(lineupId = null) {
      const code = await invitations.generateInvitationCode(lineupId);
      const [row] = await db
        .select()
        .from(schema.invitationCodes)
        .where(
          eq(
            schema.invitationCodes.codeHash,
            invitations.hashInvitationSecret(code.replaceAll("-", "")),
          ),
        );
      invitationIds.push(row.id);
      return code;
    }
    try {
      [lineup] = await db
        .insert(schema.lineups)
        .values({ name: prefix })
        .returning();
      const token = invitations.newDeviceToken();
      const code = await invite();
      await invitations.redeemInvitationCode(code, token);
      const device = await invitations.findRegisteredDevice(token);
      const key = `device:${device.id}`;
      keys.push(key);
      deviceIds.push(device.id);
      const scopedToken = invitations.newDeviceToken();
      await invitations.redeemInvitationCode(
        await invite(lineup.id),
        scopedToken,
      );
      const scoped = await invitations.findRegisteredDevice(scopedToken);
      deviceIds.push(scoped.id);
      keys.push(`device:${scoped.id}`);
      let users = await service.getManagedUsers();
      assert.equal(users.find((u) => u.viewerKey === key).nickname, null);
      assert.equal(users.find((u) => u.viewerKey === key).fullAccess, true);
      assert.equal(
        users.find((u) => u.viewerKey === `device:${scoped.id}`).invitedLineups,
        1,
      );
      assert.ok(users.find((u) => u.isYou));
      assert.doesNotMatch(JSON.stringify(users), /tokenHash|codeHash/);
      assert.equal(
        (
          await service.updateManagedNickname({
            viewerKey: key,
            nickname: "  Người chơi  ",
          })
        ).nickname,
        "Người chơi",
      );
      assert.equal(
        (
          await service.updateManagedNickname({
            viewerKey: `admin:${adminId}`,
            nickname: prefix,
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await service.updateManagedNickname({
            viewerKey: "device:2147483647",
            nickname: "Ghost",
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await service.updateManagedNickname({
            viewerKey: "admin:00000000-0000-4000-8000-000000000000",
            nickname: "Ghost",
          })
        ).status,
        404,
      );
      await db
        .insert(schema.contentShares)
        .values({ recipientKey: key, lineupId: lineup.id });
      await db
        .insert(schema.contentFollows)
        .values({ followerKey: key, kind: "lineup", targetId: lineup.id });
      await db
        .insert(schema.contentVotes)
        .values({ voterKey: key, lineupId: lineup.id, value: 1 });
      users = await service.getManagedUsers();
      assert.equal(users.find((u) => u.viewerKey === key).sharedItems, 1);
      assert.equal(
        (await service.revokeManagedUser({ viewerKey: `admin:${adminId}` }))
          .status,
        400,
      );
      assert.equal(
        (await service.revokeManagedUser({ viewerKey: key })).status,
        200,
      );
      assert.equal(await invitations.findRegisteredDevice(token), null);
      assert.equal(await invitations.rotateDeviceToken(token), null);
      assert.equal(
        await invitations.redeemInvitationCode(
          code,
          invitations.newDeviceToken(),
        ),
        false,
      );
      assert.equal(
        (await service.revokeManagedUser({ viewerKey: key })).status,
        404,
      );
      for (const [table, field] of [
        [schema.viewerProfiles, schema.viewerProfiles.viewerKey],
        [schema.contentShares, schema.contentShares.recipientKey],
        [schema.contentFollows, schema.contentFollows.followerKey],
        [schema.contentVotes, schema.contentVotes.voterKey],
      ]) {
        assert.equal(
          (await db.select().from(table).where(eq(field, key))).length,
          0,
        );
      }
      assert.ok(await invitations.findRegisteredDevice(scopedToken));
      assert.equal(
        (await service.getManagedUsers()).some((u) => u.viewerKey === key),
        false,
      );
      // A fresh invitation can register the same browser again after revocation.
      assert.equal(
        await invitations.redeemInvitationCode(await invite(), token),
        true,
      );
      const replacement = await invitations.findRegisteredDevice(token);
      deviceIds.push(replacement.id);
      assert.notEqual(replacement.id, device.id);
      adminId = null;
      assert.equal(
        (await service.revokeManagedUser({ viewerKey: `device:${scoped.id}` }))
          .status,
        403,
      );
    } finally {
      await db
        .delete(schema.viewerProfiles)
        .where(inArray(schema.viewerProfiles.viewerKey, keys));
      if (deviceIds.length)
        await db
          .delete(schema.registeredDevices)
          .where(inArray(schema.registeredDevices.id, deviceIds));
      if (invitationIds.length)
        await db
          .delete(schema.invitationCodes)
          .where(inArray(schema.invitationCodes.id, invitationIds));
      if (lineup)
        await db.delete(schema.lineups).where(eq(schema.lineups.id, lineup.id));
      await client.end();
    }
  },
);
