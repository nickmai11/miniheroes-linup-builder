import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-policy";

// Request-scoped: never cache authorization across browsers.
export const isAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.auth.getUser();
    return !error && isAdminUser(data.user);
  } catch {
    return false;
  }
});
