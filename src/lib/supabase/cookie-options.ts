export function sessionCookieOptions(origin: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: origin.startsWith("https:"),
    path: "/",
  };
}
