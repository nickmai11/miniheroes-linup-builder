import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server.js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, inArray } from "drizzle-orm";
import { loadTypeScript } from "./load-typescript.mjs";

const testUrl = process.env.SHARING_TEST_DATABASE_URL;
test(
  "nickname sharing grants only selected readers, preserves privacy and revokes across all reads",
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
    const { deviceCanReadPage } = loadTypeScript(
      "src/lib/invitation-policy.ts",
    );
    let adminId = "owner",
      token = null;
    const overrides = {
      "@/db": { db, schema },
      "@/lib/admin-access": { getAdminId: async () => adminId },
      "@/lib/app-access": {
        getRegisteredDevice: async () =>
          invitations.findRegisteredDevice(token),
        hasAppAccess: async () =>
          Boolean(
            adminId ||
            (await invitations.findRegisteredDevice(token))?.fullAccess,
          ),
        requireAppAccess: async () => {
          assert.ok(adminId);
        },
      },
      "@/lib/editing": {
        canEditContent: async () => Boolean(adminId),
        EDITING_ERROR: "Admin required",
      },
      "next/cache": { revalidatePath() {} },
      "./heroes": {
        syncSeededHeroDetails: async () => {},
        divinitiesByHeroIds: async () => new Map(),
      },
    };
    const { proxy } = loadTypeScript("src/proxy.ts", {
      ...overrides,
      "@/lib/supabase/proxy": {
        refreshAdminSession: async () => ({
          admin: Boolean(adminId),
          response: NextResponse.next(),
        }),
      },
    });
    const request = (path, referer) =>
      new NextRequest(`https://example.com${path}`, {
        headers: {
          cookie: `mh_device=${token}`,
          ...(referer ? { referer: `https://example.com${referer}` } : {}),
        },
      });
    const sharing = loadTypeScript("src/lib/content-sharing.ts", overrides);
    const lineups = loadTypeScript("src/lib/lineups.ts", overrides);
    const builds = loadTypeScript("src/lib/builds.ts", overrides);
    const lineupActions = loadTypeScript(
      "src/app/lineups/actions.ts",
      overrides,
    );
    const buildActions = loadTypeScript(
      "src/app/heroes/[slug]/build-actions.ts",
      overrides,
    );
    const changes = loadTypeScript("src/lib/changes.ts", overrides);
    const votes = loadTypeScript("src/lib/votes.ts", overrides);
    const follows = loadTypeScript("src/lib/follows.ts", overrides);
    const previews = loadTypeScript(
      "src/lib/lineup-preview-access.ts",
      overrides,
    );
    const assets = loadTypeScript("src/lib/public-url-assets.ts", overrides);
    const prefix = `sharing-${Date.now()}`;
    const fixtures = [],
      lineupIds = [],
      buildIds = [],
      profileKeys = [];
    async function insert(table, values) {
      const rows = await db.insert(table).values(values).returning();
      fixtures.push({ table, ids: rows.map((r) => r.id) });
      return rows;
    }
    try {
      const heroes = await insert(
        schema.heroes,
        Array.from({ length: 5 }, (_, i) => ({
          slug: `${prefix}-${i}`,
          name: `${prefix}-${i}`,
          role: "warrior",
          rarity: "mythic",
        })),
      );
      const [rune] = await insert(schema.runeAttributes, {
        slug: prefix,
        name: "Test rune",
        runeType: "attack",
        maxValue: 5,
      });
      const [pet] = await insert(schema.pets, {
        slug: prefix,
        name: "Shared pet",
        iconUrl: `/pets/${prefix}.png`,
      });
      const input = {
        heroId: heroes[0].id,
        name: `${prefix} build`,
        isPrivate: true,
        runeAttributeIds: [rune.id],
        weaponAttributeIds: [],
      };
      const savedBuild = await buildActions.saveHeroBuild(input);
      assert.ok(savedBuild.id, savedBuild.error);
      buildIds.push(savedBuild.id);
      const sibling = await buildActions.saveHeroBuild({
        ...input,
        name: `${prefix} unrelated`,
      });
      assert.ok(sibling.id);
      buildIds.push(sibling.id);
      const lineupInput = {
        name: `${prefix} lineup`,
        isPrivate: true,
        slots: heroes.map((h, i) => ({
          heroId: h.id,
          buildId: i === 0 ? savedBuild.id : null,
          petIds: i === 0 ? [pet.id] : [],
        })),
      };
      const savedLineup = await lineupActions.saveLineup(lineupInput);
      assert.ok(savedLineup.id, savedLineup.error);
      lineupIds.push(savedLineup.id);
      const unrelated = await lineupActions.saveLineup({
        ...lineupInput,
        name: `${prefix} unrelated lineup`,
      });
      assert.ok(unrelated.id);
      lineupIds.push(unrelated.id);
      const tokens = [
        invitations.newDeviceToken(),
        invitations.newDeviceToken(),
      ];
      const devices = await insert(
        schema.registeredDevices,
        tokens.map((t) => ({ tokenHash: invitations.hashInvitationSecret(t) })),
      );
      const profileRows = [
        { viewerKey: "admin:owner", nickname: "Owner" },
        { viewerKey: `admin:${prefix}-reader`, nickname: "Other admin" },
        ...devices.map((d) => ({
          viewerKey: `device:${d.id}`,
          nickname: "Same nickname",
        })),
      ];
      profileKeys.push(...profileRows.map((r) => r.viewerKey));
      const profiles = await db
        .insert(schema.viewerProfiles)
        .values(profileRows)
        .returning();
      const recipient = profiles.find(
        (p) => p.viewerKey === `device:${devices[0].id}`,
      );
      const readerAdmin = profiles.find(
        (p) => p.viewerKey === `admin:${prefix}-reader`,
      );
      const lineupTarget = { kind: "lineup", id: savedLineup.id };
      const buildTarget = { kind: "build", id: savedBuild.id };
      const initial = await sharing.getShareRecipients(lineupTarget);
      assert.equal(
        initial.some((r) => r.id === profiles[0].id),
        false,
      );
      assert.equal(
        initial.filter((r) => r.nickname === "Same nickname").length,
        2,
      );
      assert.equal(
        initial.some((r) => Object.hasOwn(r, "viewerKey")),
        false,
      );
      assert.equal(
        (
          await sharing.saveShareRecipients({
            ...lineupTarget,
            recipientIds: [recipient.id, readerAdmin.id, recipient.id],
          })
        ).status,
        200,
      );
      assert.equal(
        (await sharing.getShareRecipients(lineupTarget)).filter(
          (r) => r.selected,
        ).length,
        2,
      );
      assert.equal(
        (
          await sharing.saveShareRecipients({
            ...lineupTarget,
            recipientIds: [2147483647],
          })
        ).status,
        400,
      );
      assert.equal(
        (await sharing.getShareRecipients(lineupTarget)).filter(
          (r) => r.selected,
        ).length,
        2,
      );
      adminId = null;
      token = tokens[0];
      let device = await invitations.findRegisteredDevice(token);
      assert.equal(device.fullAccess, false);
      assert.deepEqual(device.lineupIds, [savedLineup.id]);
      assert.equal(
        deviceCanReadPage(device, `/lineups/${savedLineup.id}`),
        true,
      );
      assert.equal(
        deviceCanReadPage(device, `/lineups/${unrelated.id}`),
        false,
      );
      assert.equal(
        deviceCanReadPage(device, `/heroes/${heroes[0].slug}`),
        false,
      );
      assert.equal(deviceCanReadPage(device, "/shared"), true);
      assert.equal(
        (await proxy(request(`/lineups/${savedLineup.id}`))).headers.get(
          "x-middleware-next",
        ),
        "1",
      );
      assert.equal(
        (await proxy(request("/shared"))).headers.get("x-middleware-next"),
        "1",
      );
      assert.equal(
        (
          await proxy(request(pet.iconUrl, `/lineups/${savedLineup.id}`))
        ).headers.get("x-middleware-next"),
        "1",
      );

      let lineup = await lineups.getLineup(savedLineup.id);
      assert.equal(lineup.isPrivate, true);
      assert.equal(lineup.canManage, false);
      assert.equal(lineup.slots[0].build, null);
      assert.equal(await lineups.getLineup(unrelated.id), undefined);
      assert.equal(
        (
          await votes.getVoteAccess({
            ...lineupTarget,
            page: `/lineups/${savedLineup.id}`,
          })
        ).allowed,
        true,
      );
      assert.equal((await follows.getFollowAccess(lineupTarget)).allowed, true);
      assert.equal(
        await assets.isPublicPageAsset(
          `/lineups/${savedLineup.id}`,
          pet.iconUrl,
          device.lineupIds,
          recipient.viewerKey,
        ),
        true,
      );
      assert.equal(
        await assets.isPublicPageAsset(
          `/lineups/${savedLineup.id}`,
          pet.iconUrl,
          device.lineupIds,
        ),
        false,
      );
      assert.equal(await sharing.getShareRecipients(lineupTarget), null);
      assert.equal(
        (
          await sharing.saveShareRecipients({
            ...lineupTarget,
            recipientIds: [],
          })
        ).status,
        401,
      );
      adminId = `${prefix}-reader`;
      token = null;
      assert.equal((await lineups.getLineup(savedLineup.id)).canManage, false);
      assert.equal(await sharing.getShareRecipients(lineupTarget), null);
      assert.equal(
        (
          await sharing.saveShareRecipients({
            ...lineupTarget,
            recipientIds: [],
          })
        ).status,
        404,
      );
      assert.ok(
        (await lineupActions.setLineupVisibility(savedLineup.id, false)).error,
      );
      assert.ok(
        (await lineupActions.saveLineup({ ...lineupInput, id: savedLineup.id }))
          .error,
      );
      adminId = "owner";
      await sharing.saveShareRecipients({
        ...buildTarget,
        recipientIds: [recipient.id, readerAdmin.id],
      });
      // A nickname change keeps the same grant and checkbox identity.
      await db
        .update(schema.viewerProfiles)
        .set({ nickname: "Renamed" })
        .where(eq(schema.viewerProfiles.id, recipient.id));
      assert.equal(
        (await sharing.getShareRecipients(buildTarget)).find(
          (r) => r.id === recipient.id,
        ).nickname,
        "Renamed",
      );
      adminId = null;
      token = tokens[0];
      device = await invitations.findRegisteredDevice(token);
      assert.equal(
        deviceCanReadPage(device, `/heroes/${heroes[0].slug}`),
        true,
      );
      assert.equal(
        deviceCanReadPage(device, `/heroes/${heroes[1].slug}`),
        false,
      );
      assert.equal(
        deviceCanReadPage(device, `/lineups/${savedLineup.id}/edit`),
        false,
      );
      assert.equal(
        (await proxy(request(`/heroes/${heroes[0].slug}`))).headers.get(
          "x-middleware-next",
        ),
        "1",
      );
      const readable = await builds.getHeroBuilds(heroes[0].id);
      assert.deepEqual(
        readable.map((b) => b.id),
        [savedBuild.id],
      );
      assert.equal(readable[0].canManage, false);
      assert.equal(
        (await lineups.getLineup(savedLineup.id)).slots[0].build.id,
        savedBuild.id,
      );
      assert.ok(
        (await changes.getChangeHistory("build", savedBuild.id)).entries.length,
      );
      assert.ok(
        (await changes.getChangeHistory("lineup", savedLineup.id)).entries
          .length,
      );
      assert.deepEqual(
        await previews.heroLineupPreviewIds(heroes[0].slug, device.lineupIds),
        [savedLineup.id],
      );
      assert.equal(
        (
          await votes.getVoteAccess({
            ...buildTarget,
            page: `/heroes/${heroes[0].slug}`,
          })
        ).allowed,
        true,
      );
      assert.equal((await sharing.getSharedItems()).length, 2);
      token = tokens[1];
      assert.equal(await lineups.getLineup(savedLineup.id), undefined);
      assert.deepEqual(await builds.getHeroBuilds(heroes[0].id), []);
      assert.deepEqual(await sharing.getSharedItems(), []);
      adminId = `${prefix}-reader`;
      token = null;
      assert.equal(
        (await builds.getBuildsByIds([savedBuild.id]))[0].canManage,
        false,
      );
      assert.ok(
        (await buildActions.setBuildVisibility(savedBuild.id, false)).error,
      );
      assert.ok(
        (await buildActions.saveHeroBuild({ ...input, id: savedBuild.id }))
          .error,
      );
      assert.ok((await buildActions.deleteHeroBuild(savedBuild.id)).error);
      assert.equal(
        (
          await sharing.saveShareRecipients({
            ...buildTarget,
            recipientIds: [],
          })
        ).status,
        404,
      );
      adminId = "owner";
      assert.equal(
        (
          await sharing.saveShareRecipients({
            ...lineupTarget,
            recipientIds: [],
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await sharing.saveShareRecipients({
            ...buildTarget,
            recipientIds: [],
          })
        ).status,
        200,
      );
      adminId = null;
      token = tokens[0];
      device = await invitations.findRegisteredDevice(token);
      assert.deepEqual(device.lineupIds, []);
      assert.equal(
        deviceCanReadPage(device, `/heroes/${heroes[0].slug}`),
        false,
      );
      assert.equal(await lineups.getLineup(savedLineup.id), undefined);
      assert.deepEqual(await builds.getBuildsByIds([savedBuild.id]), []);
      assert.equal(
        await changes.getChangeHistory("build", savedBuild.id),
        null,
      );
      assert.equal(
        (
          await votes.getVoteAccess({
            ...lineupTarget,
            page: `/lineups/${savedLineup.id}`,
          })
        ).allowed,
        false,
      );
      assert.equal(
        (await follows.getFollowAccess(lineupTarget)).allowed,
        false,
      );
      assert.equal(
        await assets.isPublicPageAsset(
          `/lineups/${savedLineup.id}`,
          pet.iconUrl,
          undefined,
          recipient.viewerKey,
        ),
        false,
      );
      assert.deepEqual(await sharing.getSharedItems(), []);
      assert.equal(
        (await proxy(request(`/lineups/${savedLineup.id}`))).status,
        307,
      );
      assert.equal(
        (await proxy(request(`/heroes/${heroes[0].slug}`))).status,
        307,
      );
      assert.equal(
        (await proxy(request(pet.iconUrl, `/lineups/${savedLineup.id}`)))
          .status,
        401,
      );
    } finally {
      if (profileKeys.length)
        await db
          .delete(schema.viewerProfiles)
          .where(inArray(schema.viewerProfiles.viewerKey, profileKeys));
      for (const [kind, ids] of [
        ["lineup", lineupIds],
        ["build", buildIds],
      ])
        if (ids.length)
          await db
            .delete(schema.contentChanges)
            .where(
              and(
                eq(schema.contentChanges.kind, kind),
                inArray(schema.contentChanges.targetId, ids),
              ),
            );
      if (lineupIds.length)
        await db
          .delete(schema.lineups)
          .where(inArray(schema.lineups.id, lineupIds));
      for (const fixture of fixtures.reverse())
        await db
          .delete(fixture.table)
          .where(inArray(fixture.table.id, fixture.ids));
      await client.end();
    }
  },
);
