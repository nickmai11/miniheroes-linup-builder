import "server-only";

/** Log a diagnostic code without SQL parameters, invitation codes, or cookies. */
export function reportAccessError(operation: string, error: unknown): void {
  let code = "UNKNOWN";
  let cause = error;
  for (
    let depth = 0;
    depth < 5 && cause && typeof cause === "object";
    depth++
  ) {
    if (
      "code" in cause &&
      typeof cause.code === "string" &&
      /^[A-Z0-9_]{2,40}$/.test(cause.code)
    ) {
      code = cause.code;
      break;
    }
    cause = "cause" in cause ? cause.cause : undefined;
  }
  console.error("Access operation failed", {
    operation,
    code,
    ...(code === "42P01" || code === "42703"
      ? { hint: "Apply pending database migrations before running this app." }
      : {}),
  });
}
