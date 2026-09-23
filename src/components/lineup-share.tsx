"use client";
import { ContentShare } from "@/components/content-share";

export function LineupShare({
  lineupId,
  canInvite,
}: {
  lineupId: number;
  canInvite: boolean;
}) {
  return canInvite ? <ContentShare kind="lineup" id={lineupId} /> : null;
}
