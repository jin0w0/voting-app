import { formatKoreaTime, type PollStatus } from "@/lib/poll-rules";

// "마감됨" for a closed poll, "10월 1일 18:00 마감" for an open one with a deadline, nothing otherwise.
export function PollStatusLabel({
  poll,
}: {
  poll: { status: PollStatus; deadline: Date | null; now: Date };
}) {
  if (poll.status === "closed") {
    return (
      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        마감됨
      </span>
    );
  }
  if (!poll.deadline) return null;
  return <span className="text-xs text-zinc-500">{formatKoreaTime(poll.deadline, poll.now)} 마감</span>;
}
