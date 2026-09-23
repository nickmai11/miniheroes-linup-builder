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
  const options = {
    prepare: false,
    // Serverless runtimes multiply these pools; the shared pooler has a finite
    // client limit. Queue extra work locally and release quiet connections.
    max: 2,
    // Supavisor can stall when a parameterless query is pipelined with a
    // Parse/Describe/Flush exchange. Wait for ReadyForQuery before sending
    // another query on that socket. In Postgres.js, 0 disables pipelining;
    // 1 still permits a second in-flight query. Keep both pool connections.
    // patches/postgres@3.4.9.patch preserves transaction reservation at 0.
    max_pipeline: 0,
    idle_timeout: 20,
    max_lifetime: 60 * 5,
  };
  const client = postgres(env.DATABASE_URL, options);
  globalForDb.pg = { url: env.DATABASE_URL, client };
  return client;
}

export const db = drizzle(getClient(), { schema });
export { schema };
