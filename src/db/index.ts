import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

type Cached = { url: string; client: ReturnType<typeof postgres> };
const globalForDb = globalThis as unknown as { pg?: Cached };

// Reuse the client across HMR reloads in dev so we don't leak connections,
// but rebuild it if DATABASE_URL changes (e.g. after editing .env).
// `prepare: false` is required for Supabase's transaction pooler (port 6543).
function getClient() {
  const cached = globalForDb.pg;
  if (cached && cached.url === env.DATABASE_URL) return cached.client;
  if (cached) void cached.client.end({ timeout: 1 });
  const client = postgres(env.DATABASE_URL, { prepare: false, max: 10 });
  if (env.NODE_ENV !== "production")
    globalForDb.pg = { url: env.DATABASE_URL, client };
  return client;
}

export const db = drizzle(getClient(), { schema });
export { schema };
