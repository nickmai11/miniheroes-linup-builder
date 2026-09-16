import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, inArray } from "drizzle-orm";
import { loadTypeScript } from "./load-typescript.mjs";

const testUrl = process.env.NOTIFICATIONS_TEST_DATABASE_URL;
test(
  "lineup notifications deliver atomically, isolate readers, and respect current access",
  { skip: !testUrl },
  async () => {
    const url = new URL(testUrl);
    assert.equal(url.hostname, "127.0.0.1");
    assert.equal(url.port, "55443");
    assert.equal(url.username, "vote_test");
    assert.equal(url.pathname, "/votes_test");
    const client = postgres(testUrl, { prepare: false });
    const schema = loadTypeScript("src/db/schema.ts");
    let failNotification = false;
    const db = drizzle(client, {
      schema,
      logger: {
        logQuery(query) {
          if (
            failNotification &&
            query.includes('insert into "lineup_notifications"')
          )
            throw new Error("Notification failure");
        },
      },
    });
    const prefix = `notification-${Date.now()}`;
    let adminId = prefix;
    let device = null;
    const overrides = {
      "@/db": { db, schema },
      "@/lib/admin-access": { getAdminId: async () => adminId },
      "@/lib/app-access": {
        requireAppAccess: async () => {},
        hasAppAccess: async () => Boolean(adminId || device?.fullAccess),
        getRegisteredDevice: async () => device,
      },
      "@/lib/editing": {
        requireEditing: async () => {},
        canEditContent: async () => true,
      },
      "next/cache": { revalidatePath: () => {} },
      "next/navigation": {
        redirect: (path) => {
          throw new Error(`Redirect ${path}`);
        },
      },
    };
    const { saveLineup } = loadTypeScript(
      "src/app/lineups/actions.ts",
      overrides,
    );
    const follows = loadTypeScript("src/lib/follows.ts", overrides);
    const notifications = loadTypeScript("src/lib/notifications.ts", overrides);
    const { GET, POST } = loadTypeScript("src/app/api/notifications/route.ts", {
      "@/lib/notifications": notifications,
    });
    const origin = "https://miniheroes-library.vercel.app";
    const get = (query = "") =>
      GET(new Request(`${origin}/api/notifications${query}`));
    const post = (body, requestOrigin = origin) =>
      POST(
        new Request(`${origin}/api/notifications`, {
          method: "POST",
          headers: {
            origin: requestOrigin,
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        }),
      );
    const fixtures = [];
    const ids = [];
    const keys = [
      `admin:${prefix}`,
      `admin:${prefix}-other`,
      `device:${Date.now()}`,
      `device:${Date.now() + 1}`,
    ];
    async function insert(table, values) {
      const rows = await db.insert(table).values(values).returning();
      fixtures.push({ table, ids: rows.map((row) => row.id) });
      return rows;
    }
    async function save(input) {
      const result = await saveLineup(input);
      assert.equal(result.error, undefined);
      if (!ids.includes(result.id)) ids.push(result.id);
      return result.id;
    }
    const page = () => notifications.getNotifications();
    try {
      const heroes = await insert(
        schema.heroes,
        Array.from({ length: 5 }, (_, i) => ({
          slug: `${prefix}-${i}`,
          name: `Hero ${i}`,
          role: "warrior",
          rarity: "mythic",
        })),
      );
      const original = {
        name: prefix,
        description: "Original",
        slots: heroes.map((hero) => ({ heroId: hero.id })),
        fishSelections: [],
      };
      const id = await save(original);
      const target = { kind: "lineup", id };
      const edited = { ...original, id, description: "Updated" };
      await follows.setFollow(target, keys[0], true);
      await follows.setFollow(target, keys[2], true);
      await follows.setFollow(
        { kind: "hero", id: heroes[0].id },
        keys[3],
        true,
      );
      assert.equal(
        (await page()).unreadCount,
        0,
        "following does not backfill old changes",
      );
      await save(edited);
      const first = await page();
      assert.equal(first.unreadCount, 1);
      assert.deepEqual(first.items[0].fields, ["Notes"]);
      assert.equal(first.items[0].href, `/lineups/${id}`);
      await save(edited);
      assert.equal((await page()).unreadCount, 1, "no-op saves do not notify");
      await save({ ...original, name: `${prefix} clone` });
      assert.equal(
        (await page()).unreadCount,
        1,
        "new lineups do not notify other follows",
      );
      adminId = null;
      device = {
        id: Number(keys[3].split(":")[1]),
        fullAccess: true,
        lineupIds: [],
      };
      assert.equal(
        (await page()).unreadCount,
        0,
        "hero follows do not subscribe to lineups",
      );
      device.id = Number(keys[2].split(":")[1]);
      const deviceFirst = await page();
      assert.equal(deviceFirst.unreadCount, 1);
      await notifications.markNotificationsRead({ id: first.items[0].id });
      assert.equal(
        (await page()).unreadCount,
        1,
        "another follower's ID cannot be marked read",
      );
      await notifications.markNotificationsRead({
        id: deviceFirst.items[0].id,
      });
      await notifications.markNotificationsRead({
        id: deviceFirst.items[0].id,
      });
      assert.equal((await page()).unreadCount, 0);
      adminId = prefix;
      assert.equal(
        (await page()).unreadCount,
        1,
        "read state is isolated by viewer",
      );
      await save({ ...edited, description: "Second update" });
      await notifications.markNotificationsRead({ throughId: first.latestId });
      assert.equal(
        (await page()).unreadCount,
        1,
        "mark all leaves updates after its snapshot unread",
      );

      const beforeFailure = (
        await db.select().from(schema.lineups).where(eq(schema.lineups.id, id))
      )[0];
      failNotification = true;
      await assert.rejects(saveLineup({ ...edited, name: "Must roll back" }));
      failNotification = false;
      assert.deepEqual(
        (
          await db
            .select()
            .from(schema.lineups)
            .where(eq(schema.lineups.id, id))
        )[0],
        beforeFailure,
      );
      assert.equal(
        (await page()).items.length,
        2,
        "failed saves roll back notifications and history",
      );

      await follows.setFollow(target, keys[1], true);
      adminId = `${prefix}-other`;
      assert.equal(
        (await page()).items.length,
        0,
        "new followers start with future updates",
      );
      adminId = prefix;
      await save({ ...edited, description: "Third update" });
      await db
        .update(schema.lineups)
        .set({ privateOwnerId: prefix })
        .where(eq(schema.lineups.id, id));
      assert.equal(
        (await page()).items.length,
        3,
        "owner retains private notifications",
      );
      adminId = `${prefix}-other`;
      assert.equal(
        (await page()).unreadCount,
        0,
        "another admin cannot see private notifications",
      );
      adminId = null;
      assert.equal(
        (await page()).items.length,
        0,
        "full-access devices cannot see private notifications",
      );
      await notifications.markNotificationsRead({ throughId: 2147483647 });
      await db
        .update(schema.lineups)
        .set({ privateOwnerId: null })
        .where(eq(schema.lineups.id, id));
      assert.equal(
        (await page()).unreadCount,
        2,
        "hidden notifications cannot be marked read",
      );
      device.fullAccess = false;
      assert.equal(
        (await page()).items.length,
        0,
        "revoking invitation hides notifications",
      );
      device.lineupIds = [id];
      assert.equal((await page()).items.length, 3);
      device.lineupIds = [];
      await insert(schema.publicUrls, { path: `/lineups/${id}` });
      assert.equal((await page()).items[0].href, `/lineups/${id}`);
      await db
        .delete(schema.publicUrls)
        .where(eq(schema.publicUrls.path, `/lineups/${id}`));
      await insert(schema.publicUrls, { path: "/lineups" });
      assert.equal((await page()).items[0].href, "/lineups");
      await db
        .delete(schema.publicUrls)
        .where(eq(schema.publicUrls.path, "/lineups"));
      device.fullAccess = true;
      await follows.setFollow(target, keys[2], false);
      assert.equal(
        (await page()).items.length,
        0,
        "unfollow cascades notifications",
      );
      await follows.setFollow(target, keys[2], true);
      assert.equal((await page()).items.length, 0, "refollow starts fresh");
      adminId = prefix;
      for (let i = 0; i < 21; i++)
        await save({ ...edited, description: `Revision ${i}` });
      const newest = await page();
      const older = await notifications.getNotifications(newest.nextCursor);
      assert.equal(newest.items.length, 20);
      assert.equal(older.items.length, 4);
      assert.equal(
        new Set([...newest.items, ...older.items].map((item) => item.id)).size,
        24,
      );
      assert.equal(older.nextCursor, null);
      const response = await get();
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal((await get("?before=-1")).status, 400);
      assert.equal((await get("?followerKey=forged")).status, 400);
      assert.equal(
        (await post({ id: newest.latestId }, "https://other.example")).status,
        403,
      );
      assert.equal(
        (await post({ id: newest.latestId, followerKey: keys[2] })).status,
        400,
      );
      assert.equal(
        (await post({ throughId: newest.latestId, id: newest.latestId }))
          .status,
        400,
      );
      assert.equal((await post({ id: "x".repeat(1500) })).status, 400);
      assert.equal((await post({ throughId: newest.latestId })).status, 200);
      assert.equal((await page()).unreadCount, 0);
      assert.ok((await page()).items.every((item) => item.read));
      adminId = null;
      device = null;
      assert.equal((await get()).status, 401);
      assert.equal((await post({ id: newest.latestId })).status, 401);
      adminId = prefix;
      await db.delete(schema.lineups).where(eq(schema.lineups.id, id));
      assert.deepEqual(
        (await page()).items,
        [],
        "deleted lineups do not leak old notification names",
      );
    } finally {
      failNotification = false;
      await db
        .delete(schema.contentFollows)
        .where(inArray(schema.contentFollows.followerKey, keys));
      if (ids.length) {
        await db
          .delete(schema.contentChanges)
          .where(
            and(
              eq(schema.contentChanges.kind, "lineup"),
              inArray(schema.contentChanges.targetId, ids),
            ),
          );
        await db.delete(schema.lineups).where(inArray(schema.lineups.id, ids));
      }
      for (const fixture of fixtures.reverse())
        await db
          .delete(fixture.table)
          .where(inArray(fixture.table.id, fixture.ids));
      await client.end();
    }
  },
);
