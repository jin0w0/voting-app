import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export const ADMIN_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

// A token is "<expiresAtMs>.<signature>"; nothing else is stored.
export function issueAdminSession(secret: string, now: Date): string {
  const payload = String(now.getTime() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);
  return `${payload}.${sign(payload, secret)}`;
}

export function isValidAdminSession(
  token: string | undefined,
  secret: string,
  now: Date,
): boolean {
  if (!token || secret === "") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  return now.getTime() < Number(payload);
}

export function isCorrectAdminPassword(input: string, adminPassword: string): boolean {
  if (adminPassword === "") return false;
  // Hash both sides so the comparison takes the same time whatever the input length.
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(adminPassword).digest();
  return timingSafeEqual(a, b);
}
