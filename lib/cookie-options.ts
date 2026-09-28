// Options every cookie this app sets shares; each cookie module adds its own maxAge.
export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  } as const;
}
