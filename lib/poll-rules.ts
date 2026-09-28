export type PollInput = { question: string; optionNames: string[] };

export type PollInputErrors = { question?: string; options?: string };

export type PollInputResult =
  | { ok: true; poll: PollInput }
  | { ok: false; errors: PollInputErrors };

// Two options are the same if they match ignoring case. The database enforces the same rule
// with lower(), which catches any case the two disagree on.
function optionKey(option: string): string {
  return option.toLowerCase();
}

export const DUPLICATE_OPTION_ERROR = "같은 선택지가 두 번 들어 있습니다.";

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;

export function validatePollInput(question: string, optionNames: string[]): PollInputResult {
  const poll = { question: question.trim(), optionNames: optionNames.map((name) => name.trim()) };
  const errors: PollInputErrors = {};

  if (poll.question === "") errors.question = "질문을 입력하세요.";

  if (poll.optionNames.length < MIN_OPTIONS || poll.optionNames.length > MAX_OPTIONS) {
    errors.options = `선택지는 ${MIN_OPTIONS}개 이상 ${MAX_OPTIONS}개 이하로 입력하세요.`;
  } else if (poll.optionNames.includes("")) {
    errors.options = "빈 선택지가 있습니다.";
  } else if (new Set(poll.optionNames.map(optionKey)).size !== poll.optionNames.length) {
    errors.options = DUPLICATE_OPTION_ERROR;
  }

  return Object.keys(errors).length === 0 ? { ok: true, poll } : { ok: false, errors };
}

export type Results<T extends { votes: number }> = {
  totalVotes: number;
  // leading: most votes (all tied options lead); nobody leads while there are no votes.
  options: (T & { percent: number; leading: boolean })[];
};

// Keeps option order. Percentages are rounded for display, so they may not add up to exactly 100.
export function computeResults<T extends { votes: number }>(options: T[]): Results<T> {
  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);
  const mostVotes = Math.max(0, ...options.map((option) => option.votes));
  return {
    totalVotes,
    options: options.map((option) => ({
      ...option,
      percent: totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100),
      leading: mostVotes > 0 && option.votes === mostVotes,
    })),
  };
}
