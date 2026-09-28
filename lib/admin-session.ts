import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  isCorrectAdminPassword,
  isValidAdminSession,
  issueAdminSession,
} from "./admin-auth";

const ADMIN_SESSION_COOKIE = "admin_session";

function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? "";
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return isValidAdminSession(token, sessionSecret(), new Date());
}

// Call at the top of every admin page and every admin server action.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

// Server functions only. Returns false when the password is wrong or login is not configured.
export async function startAdminSession(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  if (adminPassword === "" || sessionSecret() === "") {
    console.error("Admin login is disabled: ADMIN_PASSWORD and SESSION_SECRET must both be set.");
    return false;
  }
  if (!isCorrectAdminPassword(password, adminPassword)) return false;

  (await cookies()).set(ADMIN_SESSION_COOKIE, issueAdminSession(sessionSecret(), new Date()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return true;
}

// Server functions only.
export async function endAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}
