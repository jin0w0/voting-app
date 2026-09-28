import { describe, expect, it } from "vitest";
import { validatePollInput } from "./poll-rules";

describe("validatePollInput", () => {
  it("accepts a poll, trimming text and keeping option order", () => {
    expect(validatePollInput("  점심 뭐 먹을까?  ", [" 짜장 ", "짬뽕", "  볶음밥"])).toEqual({
      ok: true,
      poll: { question: "점심 뭐 먹을까?", optionNames: ["짜장", "짬뽕", "볶음밥"] },
    });
  });

  const numbered = (count: number) => Array.from({ length: count }, (_, i) => `선택지 ${i + 1}`);

  it.each([2, 10])("accepts %i options", (count) => {
    expect(validatePollInput("질문", numbered(count)).ok).toBe(true);
  });

  it.each([1, 11])("rejects %i options", (count) => {
    expect(validatePollInput("질문", numbered(count))).toEqual({
      ok: false,
      errors: { options: "선택지는 2개 이상 10개 이하로 입력하세요." },
    });
  });

  it.each(["", "   "])("rejects an empty question text %j", (question) => {
    expect(validatePollInput(question, ["짜장", "짬뽕"])).toEqual({
      ok: false,
      errors: { question: "질문을 입력하세요." },
    });
  });

  it.each([["짜장", ""], ["짜장", "  ", "짬뽕"]])("rejects a blank option in %j", (...optionNames) => {
    expect(validatePollInput("질문", optionNames)).toEqual({
      ok: false,
      errors: { options: "빈 선택지가 있습니다." },
    });
  });

  it.each([
    ["Yes", "yes"],
    ["짜장", " 짜장 "],
  ])("rejects duplicate options %j and %j", (first, second) => {
    expect(validatePollInput("질문", [first, "기타", second])).toEqual({
      ok: false,
      errors: { options: "같은 선택지가 두 번 들어 있습니다." },
    });
  });

  it("reports question and option problems together", () => {
    expect(validatePollInput("", ["하나"])).toEqual({
      ok: false,
      errors: {
        question: "질문을 입력하세요.",
        options: "선택지는 2개 이상 10개 이하로 입력하세요.",
      },
    });
  });
});
