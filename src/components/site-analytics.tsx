"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

function beforeSend(event: BeforeSendEvent): BeforeSendEvent {
  // Shared links can contain invitation codes, device-transfer tokens, or a
  // nested destination URL. Traffic reports only need the origin and path.
  const url = new URL(event.url);
  url.search = "";
  url.hash = "";
  return { ...event, url: url.toString() };
}

export function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
