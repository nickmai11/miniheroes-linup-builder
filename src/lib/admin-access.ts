import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-policy";

// Request-scoped: never cache authorization across browsers.
export const getAdminId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    return !error && isAdminUser(data.user) ? data.user!.id : null;
  } catch {
    return null;
  }
});

export const isAdmin = cache(async (): Promise<boolean> => {
  return (await getAdminId()) !== null;
});
