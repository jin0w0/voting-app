import Link from "next/link";
import { PollStatusLabel } from "@/app/ui/poll-status-label";
import { listPolls } from "@/lib/polls";

export default async function HomePage() {
  const polls = await listPolls();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">투표</h1>
        <Link href="/admin/login" className="text-sm text-zinc-500 hover:underline">
          운영자 로그인
        </Link>
      </header>

      {polls.length === 0 ? (
        <p className="text-zinc-500">아직 투표가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {polls.map((poll) => (
            <li key={poll.id}>
              <Link
                href={`/polls/${poll.id}`}
                className="flex items-baseline justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className={poll.status === "closed" ? "text-zinc-500" : undefined}>
                    {poll.question}
                  </span>
                  <span className="flex">
                    <PollStatusLabel poll={poll} />
                  </span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-zinc-500">{poll.totalVotes}표</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
