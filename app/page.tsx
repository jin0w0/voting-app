import Link from "next/link";
import { listPolls } from "@/lib/polls";

export default async function HomePage() {
  const polls = await listPolls();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold">투표</h1>

      {polls.length === 0 ? (
        <p className="text-zinc-500">아직 투표가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {polls.map((poll) => (
            <li key={poll.id}>
              <Link
                href={`/polls/${poll.id}`}
                className="block rounded-xl border border-zinc-200 px-4 py-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                {poll.question}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
