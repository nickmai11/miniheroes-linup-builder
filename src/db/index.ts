import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof createClient>;
};

// Reuse the client across HMR reloads in dev so we don't leak connections.
const client =
  globalForDb.client ??
  createClient({ url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN });
if (env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { schema });
export { schema };
