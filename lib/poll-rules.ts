// What the admin typed. deadline is a datetime-local value ("YYYY-MM-DDTHH:mm") in Korea time, or null.
export type PollForm = { question: string; optionNames: string[]; deadline: string | null };

export type PollInput = { question: string; optionNames: string[]; deadline: Date | null };

export type PollInputErrors = { question?: string; options?: string; deadline?: string };

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

export function validatePollInput(form: PollForm, now: Date): PollInputResult {
  const poll = {
    question: form.question.trim(),
    optionNames: form.optionNames.map((name) => name.trim()),
    deadline: form.deadline === null ? null : parseKoreaTime(form.deadline),
  };
  const errors: PollInputErrors = {};

  if (poll.question === "") errors.question = "질문을 입력하세요.";

  if (form.deadline !== null) {
    if (poll.deadline === null) errors.deadline = "마감 시각을 다시 입력하세요.";
    else if (poll.deadline.getTime() <= now.getTime()) errors.deadline = "마감 시각은 지금보다 뒤여야 합니다.";
  }

  if (poll.optionNames.length < MIN_OPTIONS || poll.optionNames.length > MAX_OPTIONS) {
    errors.options = `선택지는 ${MIN_OPTIONS}개 이상 ${MAX_OPTIONS}개 이하로 입력하세요.`;
  } else if (poll.optionNames.includes("")) {
    errors.options = "빈 선택지가 있습니다.";
  } else if (new Set(poll.optionNames.map(optionKey)).size !== poll.optionNames.length) {
    errors.options = DUPLICATE_OPTION_ERROR;
  }

  return Object.keys(errors).length === 0 ? { ok: true, poll } : { ok: false, errors };
}

export type PollStatus = "open" | "closed";

// Pass the database's clock as `now` so every check agrees on the time.
export function pollStatus(
  poll: { deadline: Date | null; closedAt: Date | null },
  now: Date,
): PollStatus {
  if (poll.closedAt !== null) return "closed";
  return poll.deadline !== null && now.getTime() >= poll.deadline.getTime() ? "closed" : "open";
}

// "10월 1일 18:00" in Korea time; the year is added when it differs from `now`'s.
export function formatKoreaTime(date: Date, now: Date): string {
  const zone = { timeZone: "Asia/Seoul" } as const;
  const year = (d: Date) => new Intl.DateTimeFormat("ko-KR", { ...zone, year: "numeric" }).format(d);
  return new Intl.DateTimeFormat("ko-KR", {
    ...zone,
    year: year(date) === year(now) ? undefined : "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

// Korea has no daylight saving time, so Korea time is always UTC+9. Null if malformed.
function parseKoreaTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(value + ":00+09:00");
  if (Number.isNaN(date.getTime())) return null;
  // Date rolls impossible values over (Feb 30 → Mar 2, 24:00 → next day); reject those.
  const backInKorea = new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);
  return backInKorea === value ? date : null;
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
