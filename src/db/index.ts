import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

type Cached = { url: string; client: ReturnType<typeof postgres> };
const globalForDb = globalThis as unknown as { pg?: Cached };

// Share one bounded pool across module loads in each runtime, including
// production route bundles and development HMR. Rebuild if the URL changes.
// `prepare: false` is required for Supabase's transaction pooler (port 6543).
function getClient() {
  const cached = globalForDb.pg;
  if (cached && cached.url === env.DATABASE_URL) return cached.client;
  if (cached) void cached.client.end({ timeout: 1 });
  const client = postgres(env.DATABASE_URL, {
    prepare: false,
    // Serverless runtimes multiply these pools; the shared pooler has a finite
    // client limit. Queue extra work locally and release quiet connections.
    max: 2,
    idle_timeout: 20,
    max_lifetime: 60 * 5,
  });
  globalForDb.pg = { url: env.DATABASE_URL, client };
  return client;
}

export const db = drizzle(getClient(), { schema });
export { schema };
