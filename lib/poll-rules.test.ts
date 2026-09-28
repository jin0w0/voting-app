import { describe, expect, it } from "vitest";
import { computeResults, pollStatus, validatePollInput } from "./poll-rules";

describe("computeResults", () => {
  it("gives every option 0% and no leader when there are no votes", () => {
    expect(computeResults([{ name: "짜장", votes: 0 }, { name: "짬뽕", votes: 0 }])).toEqual({
      totalVotes: 0,
      options: [
        { name: "짜장", votes: 0, percent: 0, leading: false },
        { name: "짬뽕", votes: 0, percent: 0, leading: false },
      ],
    });
  });

  it("gives 100% and the lead to the only option that got votes", () => {
    expect(computeResults([{ name: "짜장", votes: 0 }, { name: "짬뽕", votes: 4 }])).toEqual({
      totalVotes: 4,
      options: [
        { name: "짜장", votes: 0, percent: 0, leading: false },
        { name: "짬뽕", votes: 4, percent: 100, leading: true },
      ],
    });
  });

  it("rounds percentages to whole numbers", () => {
    const results = computeResults([
      { name: "A", votes: 1 },
      { name: "B", votes: 1 },
      { name: "C", votes: 1 },
    ]);
    expect(results.options.map((o) => o.percent)).toEqual([33, 33, 33]);
    expect(computeResults([{ name: "A", votes: 2 }, { name: "B", votes: 1 }]).options.map((o) => o.percent)).toEqual([67, 33]);
  });

  it("marks every option tied for the most votes as leading", () => {
    const results = computeResults([
      { name: "A", votes: 3 },
      { name: "B", votes: 1 },
      { name: "C", votes: 3 },
    ]);
    expect(results.options.map((o) => o.leading)).toEqual([true, false, true]);
  });
});

// 2026-09-28 12:00 in Korea (UTC+9).
const NOW = new Date("2026-09-28T03:00:00Z");
const validate = (question: string, optionNames: string[], deadline: string | null = null) =>
  validatePollInput({ question, optionNames, deadline }, NOW);

describe("validatePollInput", () => {
  it("accepts a poll, trimming text and keeping option order", () => {
    expect(validate("  점심 뭐 먹을까?  ", [" 짜장 ", "짬뽕", "  볶음밥"])).toEqual({
      ok: true,
      poll: { question: "점심 뭐 먹을까?", optionNames: ["짜장", "짬뽕", "볶음밥"], deadline: null },
    });
  });

  const numbered = (count: number) => Array.from({ length: count }, (_, i) => `선택지 ${i + 1}`);

  it.each([2, 10])("accepts %i options", (count) => {
    expect(validate("질문", numbered(count)).ok).toBe(true);
  });

  it.each([1, 11])("rejects %i options", (count) => {
    expect(validate("질문", numbered(count))).toEqual({
      ok: false,
      errors: { options: "선택지는 2개 이상 10개 이하로 입력하세요." },
    });
  });

  it.each(["", "   "])("rejects an empty question text %j", (question) => {
    expect(validate(question, ["짜장", "짬뽕"])).toEqual({
      ok: false,
      errors: { question: "질문을 입력하세요." },
    });
  });

  it.each([["짜장", ""], ["짜장", "  ", "짬뽕"]])("rejects a blank option in %j", (...optionNames) => {
    expect(validate("질문", optionNames)).toEqual({
      ok: false,
      errors: { options: "빈 선택지가 있습니다." },
    });
  });

  it.each([
    ["Yes", "yes"],
    ["짜장", " 짜장 "],
  ])("rejects duplicate options %j and %j", (first, second) => {
    expect(validate("질문", [first, "기타", second])).toEqual({
      ok: false,
      errors: { options: "같은 선택지가 두 번 들어 있습니다." },
    });
  });

  it("reports question and option problems together", () => {
    expect(validate("", ["하나"])).toEqual({
      ok: false,
      errors: {
        question: "질문을 입력하세요.",
        options: "선택지는 2개 이상 10개 이하로 입력하세요.",
      },
    });
  });

  it("reads the deadline as Korea time", () => {
    const result = validate("질문", ["짜장", "짬뽕"], "2026-10-01T18:00");
    expect(result).toEqual({
      ok: true,
      poll: { question: "질문", optionNames: ["짜장", "짬뽕"], deadline: new Date("2026-10-01T09:00:00Z") },
    });
  });

  it("accepts a deadline one minute from now", () => {
    expect(validate("질문", ["짜장", "짬뽕"], "2026-09-28T12:01").ok).toBe(true);
  });

  it.each(["2026-09-28T12:00", "2026-09-28T11:59", "2025-12-31T23:59"])(
    "rejects a deadline that is not in the future: %s",
    (deadline) => {
      expect(validate("질문", ["짜장", "짬뽕"], deadline)).toEqual({
        ok: false,
        errors: { deadline: "마감 시각은 지금보다 뒤여야 합니다." },
      });
    },
  );

  it.each(["", "tomorrow", "2026-13-01T10:00", "2026-10-01", "2026-02-30T10:00", "2026-11-31T10:00", "2026-10-01T24:00"])("rejects a malformed deadline %j", (deadline) => {
    expect(validate("질문", ["짜장", "짬뽕"], deadline)).toEqual({
      ok: false,
      errors: { deadline: "마감 시각을 다시 입력하세요." },
    });
  });

  it("reports a deadline problem together with the others", () => {
    expect(validate("", ["하나"], "2026-09-01T10:00")).toEqual({
      ok: false,
      errors: {
        question: "질문을 입력하세요.",
        options: "선택지는 2개 이상 10개 이하로 입력하세요.",
        deadline: "마감 시각은 지금보다 뒤여야 합니다.",
      },
    });
  });
});

describe("pollStatus", () => {
  const deadline = new Date("2026-10-01T09:00:00Z");

  it("is open when there is no deadline", () => {
    expect(pollStatus({ deadline: null, closedAt: null }, NOW)).toBe("open");
  });

  it("is open until the deadline", () => {
    expect(pollStatus({ deadline, closedAt: null }, new Date("2026-10-01T08:59:00Z"))).toBe("open");
  });

  it.each(["2026-10-01T09:00:00Z", "2026-10-01T09:00:01Z", "2027-01-01T00:00:00Z"])(
    "is closed from the deadline on (%s)",
    (now) => {
      expect(pollStatus({ deadline, closedAt: null }, new Date(now))).toBe("closed");
    },
  );

  it("is closed once the admin closed it early, deadline or not", () => {
    const closedAt = new Date("2026-09-28T02:00:00Z");
    expect(pollStatus({ deadline: null, closedAt }, NOW)).toBe("closed");
    expect(pollStatus({ deadline, closedAt }, NOW)).toBe("closed");
  });
});
