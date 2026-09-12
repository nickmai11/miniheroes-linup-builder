import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (u) => u.startsWith("postgres://") || u.startsWith("postgresql://"),
      "DATABASE_URL must be a Postgres connection string",
    ),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = schema.parse(process.env);
