import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authConfig } from "@/lib/auth/config";
import { sessionCookieOptions } from "@/lib/supabase/cookie-options";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/")
    return NextResponse.redirect(new URL("/en", request.url));
  let response = NextResponse.next({ request });
  const config = authConfig();
  if (config) {
    const supabase = createServerClient(config.url, config.key, {
      cookieOptions: sessionCookieOptions(config.origin),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    try {
      await supabase.auth.getClaims();
    } catch {
      /* Protected pages perform a live user lookup and fail closed. */
    }
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
export const config = {
  matcher: [
    "/",
    "/:locale/login",
    "/:locale/register",
    "/:locale/forgot-password",
    "/:locale/reset-password",
    "/:locale/account/:path*",
    "/:locale/auth/:path*",
    "/:locale/notifications/:path*",
    "/:locale/exams/:slug/notify",
  ],
};
