import type { User } from "@supabase/supabase-js";

/** Only inspect a user returned by Supabase Auth, never a decoded cookie. */
export function isAdminUser(user: Pick<User, "app_metadata"> | null): boolean {
  // app_metadata is server-managed; users can edit user_metadata themselves.
  return user?.app_metadata?.role === "admin";
}
