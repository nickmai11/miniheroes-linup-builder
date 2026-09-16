"use client";

import type { FollowSummary, FollowTarget } from "./follow-types";

type State = {
  summary: FollowSummary | null;
  pending: boolean;
  error: string | null;
};
const initial: State = { summary: null, pending: false, error: null };
type Entry = {
  state: State;
  listeners: Set<() => void>;
  request?: Promise<void>;
};
const entries = new Map<string, Entry>();

/** Share state across follow buttons for the same target. */
export function followStore(target: FollowTarget) {
  const key = JSON.stringify(target);
  let entry = entries.get(key);
  if (!entry) {
    entry = { state: initial, listeners: new Set() };
    entries.set(key, entry);
  }
  const current = entry;
  function update(state: State) {
    current.state = state;
    current.listeners.forEach((listener) => listener());
  }
  async function request(value?: boolean) {
    if (current.request) return current.request;
    update({ ...current.state, pending: true, error: null });
    current.request = (async () => {
      try {
        const query = new URLSearchParams({
          kind: target.kind,
          id: String(target.id),
        });
        const response = await fetch(
          value === undefined ? `/api/follows?${query}` : "/api/follows",
          {
            method: value === undefined ? "GET" : "POST",
            cache: "no-store",
            ...(value === undefined
              ? {}
              : {
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...target, following: value }),
                }),
          },
        );
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        update({ summary: body, pending: false, error: null });
      } catch {
        update({
          ...current.state,
          pending: false,
          error:
            value === undefined
              ? "Could not load follow status. Please try again."
              : "Could not save your follow. Please try again.",
        });
      } finally {
        current.request = undefined;
      }
    })();
    return current.request;
  }
  return {
    subscribe(listener: () => void) {
      current.listeners.add(listener);
      return () => {
        current.listeners.delete(listener);
      };
    },
    snapshot: () => current.state,
    serverSnapshot: () => initial,
    load: () => request(),
    follow: (value: boolean) => request(value),
  };
}
