import "server-only";

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabaseConfig,
  supabaseCookieOptions,
} from "@/lib/supabase/config";
import { isAdminUser } from "@/lib/admin-policy";

export async function refreshAdminSession(request: NextRequest) {
  const response = NextResponse.next();
  const config = getSupabaseConfig();
  if (!config) return { admin: false, response };
  const supabase = createServerClient(config.url, config.key, {
    cookieOptions: supabaseCookieOptions(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });
  try {
    // getUser verifies with Supabase and returns current server-managed roles.
    // The SDK refreshes expired tokens and writes the resulting cookies above.
    const { data, error } = await supabase.auth.getUser();
    return { admin: !error && isAdminUser(data.user), response };
  } catch {
    return { admin: false, response };
  }
}
