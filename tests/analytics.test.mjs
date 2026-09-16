import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

test("analytics removes secrets from shared links and nested invitation destinations", () => {
  const { SiteAnalytics } = loadTypeScript(
    "src/components/site-analytics.tsx",
    {
      "@vercel/analytics/next": { Analytics: () => null },
    },
  );
  const { beforeSend } = SiteAnalytics().props;
  for (const [path, expectedPath] of [
    ["/lineups/123?ic=SECRET&mt=TOKEN#private", "/lineups/123"],
    ["/invite?next=%2Flineups%2F123%3Fic%3DSECRET&ic=SECRET", "/invite"],
    ["/heroes/sea-captain", "/heroes/sea-captain"],
  ]) {
    const event = { type: "pageview", url: `https://example.com${path}` };
    assert.deepEqual(beforeSend(event), {
      type: "pageview",
      url: `https://example.com${expectedPath}`,
    });
    assert.equal(event.url, `https://example.com${path}`);
  }
});
