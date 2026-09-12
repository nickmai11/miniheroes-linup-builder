import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1).default("file:./local.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = schema.parse(process.env);
