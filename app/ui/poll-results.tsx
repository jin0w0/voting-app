import type { PollResults } from "@/lib/polls";

export function PollResultsView({
  results,
  votedOptionId,
}: {
  results: PollResults;
  votedOptionId?: string | null;
}) {
  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">총 {results.totalVotes}표</p>
      <ul className="flex flex-col gap-4">
        {results.options.map((option) => {
          const mine = option.id === votedOptionId;
          return (
            <li key={option.id} className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={`break-words ${option.leading ? "font-semibold" : ""}`}>
                    {option.name}
                  </span>
                  {option.leading && (
                    <span className="rounded-full bg-indigo-800 px-2 py-0.5 text-xs font-medium text-white dark:bg-indigo-200 dark:text-zinc-950">
                      1위
                    </span>
                  )}
                  {mine && (
                    <span className="rounded-full border border-zinc-400 px-2 py-0.5 text-xs text-zinc-600 dark:border-zinc-500 dark:text-zinc-300">
                      내 선택
                    </span>
                  )}
                </div>
                <span className="shrink-0 pt-0.5 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                  {option.votes}표 · {option.percent}%
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full ${
                    option.leading ? "bg-indigo-800 dark:bg-indigo-200" : "bg-indigo-500"
                  }`}
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
