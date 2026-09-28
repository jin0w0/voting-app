import { formatKoreaTime } from "@/lib/poll-rules";
import type { PollState } from "@/lib/polls";

// "마감됨" for a closed poll, "10월 1일 18:00 마감" for an open one with a deadline, nothing otherwise.
// `large` is the poll page's version, which also names the time zone.
export function PollStatusLabel({ poll, large = false }: { poll: PollState; large?: boolean }) {
  if (poll.status === "closed") {
    return (
      <span
        className={`rounded-full bg-zinc-200 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 ${
          large ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
        }`}
      >
        마감됨
      </span>
    );
  }
  if (!poll.deadline) return null;
  return (
    <span className={`text-zinc-500 ${large ? "text-sm" : "text-xs"}`}>
      {formatKoreaTime(poll.deadline, poll.now)} 마감{large && " (한국 시간)"}
    </span>
  );
}
