import { cookies } from "next/headers";
import { cookieOptions } from "./cookie-options";
import { isUuid } from "./ids";

// Anonymous per-browser voter id (ADR-0001). Unsigned on purpose: it only
// identifies a browser, and clearing it to vote again is an accepted limit.
const VOTER_COOKIE = "voter_id";
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

// Null when the browser has no voter id yet, or a tampered one.
export async function readVoterId(): Promise<string | null> {
  const value = (await cookies()).get(VOTER_COOKIE)?.value;
  return value && isUuid(value) ? value : null;
}

// Server functions only: called once the browser's first vote is recorded.
export async function saveVoterId(voterId: string): Promise<void> {
  (await cookies()).set(VOTER_COOKIE, voterId, cookieOptions(ONE_YEAR_SECONDS));
}
