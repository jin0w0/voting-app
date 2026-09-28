import type { PollResults } from "@/lib/polls";

export function PollResultsView({
  results,
  votedOptionId,
}: {
  results: PollResults;
  votedOptionId?: string | null;
}) {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-zinc-500">총 {results.totalVotes}표</p>
      <ul className="flex flex-col gap-3">
        {results.options.map((option) => {
          const mine = option.id === votedOptionId;
          return (
            <li key={option.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className={mine ? "font-semibold" : undefined}>
                  {option.name}
                  {mine && <span className="ml-2 text-xs text-zinc-500">내 선택</span>}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                  {option.votes}표 · {option.percent}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full ${mine ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-400 dark:bg-zinc-500"}`}
                  style={{ width: `${option.percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
