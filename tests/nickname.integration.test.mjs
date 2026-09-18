import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import { loadTypeScript } from "./load-typescript.mjs";

const testUrl = process.env.PROFILE_TEST_DATABASE_URL;
test(
  "nicknames persist per account or IC user across invitations and token rotation",
  { skip: !testUrl },
  async () => {
    const url = new URL(testUrl);
    assert.equal(url.hostname, "127.0.0.1");
    assert.equal(url.port, "55443");
    assert.equal(url.username, "vote_test");
    assert.equal(url.pathname, "/votes_test");
    const client = postgres(testUrl, { prepare: false });
    const schema = loadTypeScript("src/db/schema.ts");
    const db = drizzle(client, { schema });
    const invitations = loadTypeScript("src/lib/invitations.ts", {
      "@/db": { db, schema },
    });
    let adminId = null;
    let token = null;
    const profiles = loadTypeScript("src/lib/viewer-profile.ts", {
      "@/db": { db, schema },
      "@/lib/admin-access": { getAdminId: async () => adminId },
      "@/lib/app-access": {
        getRegisteredDevice: async () =>
          invitations.findRegisteredDevice(token),
      },
    });
    const prefix = `nickname-${Date.now()}`;
    const keys = [];
    const deviceIds = [];
    const invitationIds = [];
    const lineupIds = [];
    try {
      assert.equal(await profiles.getViewerProfile(), null);
      assert.equal(
        (await profiles.saveViewerNickname({ nickname: "Anonymous" })).status,
        401,
      );
      const [lineup] = await db
        .insert(schema.lineups)
        .values({ name: prefix })
        .returning();
      lineupIds.push(lineup.id);
      async function invite(lineupId) {
        const code = await invitations.generateInvitationCode(lineupId);
        const hash = invitations.hashInvitationSecret(code.replaceAll("-", ""));
        const [row] = await db
          .select()
          .from(schema.invitationCodes)
          .where(eq(schema.invitationCodes.codeHash, hash));
        invitationIds.push(row.id);
        return code;
      }
      const scopedCode = await invite(lineup.id);
      token = invitations.newDeviceToken();
      assert.equal(
        await invitations.redeemInvitationCode(scopedCode, token),
        true,
      );
      const device = await invitations.findRegisteredDevice(token);
      assert.equal(device.fullAccess, false);
      deviceIds.push(device.id);
      keys.push(`device:${device.id}`);
      assert.deepEqual(await profiles.getViewerProfile(), { nickname: null });
      assert.equal(
        (await profiles.saveViewerNickname({ nickname: "  " })).status,
        400,
      );
      assert.equal(
        (
          await profiles.saveViewerNickname({
            nickname: "Nick",
            viewerKey: "admin:someone-else",
          })
        ).status,
        400,
      );
      assert.equal(
        (await profiles.saveViewerNickname({ nickname: "  Người chơi 🐟 " }))
          .status,
        200,
      );
      assert.deepEqual(await profiles.getViewerProfile(), {
        nickname: "Người chơi 🐟",
      });
      assert.equal(
        await invitations.redeemInvitationCode(await invite(null), token),
        true,
      );
      assert.equal(
        (await invitations.findRegisteredDevice(token)).fullAccess,
        true,
      );
      assert.equal(
        (await profiles.getViewerProfile()).nickname,
        "Người chơi 🐟",
      );
      const previousToken = token;
      token = await invitations.rotateDeviceToken(token);
      assert.ok(token);
      assert.equal(await invitations.findRegisteredDevice(previousToken), null);
      assert.equal(
        (await profiles.getViewerProfile()).nickname,
        "Người chơi 🐟",
      );
      const firstToken = token;
      token = invitations.newDeviceToken();
      assert.equal(
        await invitations.redeemInvitationCode(await invite(null), token),
        true,
      );
      const otherDevice = await invitations.findRegisteredDevice(token);
      deviceIds.push(otherDevice.id);
      keys.push(`device:${otherDevice.id}`);
      assert.deepEqual(await profiles.getViewerProfile(), { nickname: null });
      await profiles.saveViewerNickname({ nickname: "Second player" });
      token = firstToken;
      assert.equal(
        (await profiles.getViewerProfile()).nickname,
        "Người chơi 🐟",
      );
      adminId = prefix;
      keys.push(`admin:${adminId}`);
      assert.deepEqual(await profiles.getViewerProfile(), { nickname: null });
      await profiles.saveViewerNickname({ nickname: "Admin" });
      token = null;
      assert.deepEqual(await profiles.getViewerProfile(), {
        nickname: "Admin",
      });
      adminId = null;
      token = firstToken;
      assert.equal(
        (await profiles.getViewerProfile()).nickname,
        "Người chơi 🐟",
      );
    } finally {
      if (keys.length)
        await db
          .delete(schema.viewerProfiles)
          .where(inArray(schema.viewerProfiles.viewerKey, keys));
      if (invitationIds.length)
        await db
          .delete(schema.invitationCodes)
          .where(inArray(schema.invitationCodes.id, invitationIds));
      if (deviceIds.length)
        await db
          .delete(schema.registeredDevices)
          .where(inArray(schema.registeredDevices.id, deviceIds));
      if (lineupIds.length)
        await db
          .delete(schema.lineups)
          .where(inArray(schema.lineups.id, lineupIds));
      await client.end();
    }
  },
);
