import { z } from "zod";

export const NICKNAME_MAX_LENGTH = 40;
export const nicknameInputSchema = z
  .object({
    nickname: z
      .string()
      .trim()
      .min(1, "Enter your nickname.")
      .max(NICKNAME_MAX_LENGTH, "Use 40 characters or fewer.")
      .refine(
        (value) => !/\p{Cc}/u.test(value),
        "Use a single line for your nickname.",
      )
      .refine(
        (value) => /[^\s\u200B-\u200D\uFEFF]/u.test(value),
        "Enter your nickname.",
      ),
  })
  .strict();
