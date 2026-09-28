import { describe, expect, it } from "vitest";
import { isCorrectAdminPassword, isValidAdminSession, issueAdminSession } from "./admin-auth";

describe("isCorrectAdminPassword", () => {
  it("accepts the admin password", () => {
    expect(isCorrectAdminPassword("correct horse battery", "correct horse battery")).toBe(true);
  });

  it("rejects a wrong password of the same length", () => {
    expect(isCorrectAdminPassword("correct horse batterx", "correct horse battery")).toBe(false);
  });

  it("rejects a password of a different length", () => {
    expect(isCorrectAdminPassword("correct", "correct horse battery")).toBe(false);
  });

  it("rejects everything when no admin password is configured", () => {
    expect(isCorrectAdminPassword("", "")).toBe(false);
  });
});

const SECRET = "test-session-secret-0123456789abcdef";
const ISSUED_AT = new Date("2026-09-01T12:00:00Z");

describe("admin session", () => {
  it("accepts a session right after it is issued", () => {
    const token = issueAdminSession(SECRET, ISSUED_AT);
    expect(isValidAdminSession(token, SECRET, ISSUED_AT)).toBe(true);
  });

  it("accepts a session just before 7 days have passed", () => {
    const token = issueAdminSession(SECRET, ISSUED_AT);
    const almostSevenDays = new Date("2026-09-08T11:59:59Z");
    expect(isValidAdminSession(token, SECRET, almostSevenDays)).toBe(true);
  });

  it("rejects a session once 7 days have passed", () => {
    const token = issueAdminSession(SECRET, ISSUED_AT);
    const sevenDaysLater = new Date("2026-09-08T12:00:00Z");
    expect(isValidAdminSession(token, SECRET, sevenDaysLater)).toBe(false);
  });

  it("rejects a session signed with a different secret", () => {
    const token = issueAdminSession("some-other-secret-0123456789abcdef", ISSUED_AT);
    expect(isValidAdminSession(token, SECRET, ISSUED_AT)).toBe(false);
  });

  it("rejects a session whose expiry was tampered with", () => {
    const token = issueAdminSession(SECRET, ISSUED_AT);
    const signature = token.split(".")[1];
    const farFuture = String(new Date("2099-01-01T00:00:00Z").getTime());
    const sevenDaysLater = new Date("2026-09-08T12:00:00Z");
    expect(isValidAdminSession(`${farFuture}.${signature}`, SECRET, sevenDaysLater)).toBe(false);
  });

  it.each(["", "garbage", "123.", ".abc", "1.2.3"])("rejects a malformed session %j", (token) => {
    expect(isValidAdminSession(token, SECRET, ISSUED_AT)).toBe(false);
  });

  it("rejects a missing session", () => {
    expect(isValidAdminSession(undefined, SECRET, ISSUED_AT)).toBe(false);
  });

  it("rejects every session when no session secret is configured", () => {
    const token = issueAdminSession("", ISSUED_AT);
    expect(isValidAdminSession(token, "", ISSUED_AT)).toBe(false);
  });
});
