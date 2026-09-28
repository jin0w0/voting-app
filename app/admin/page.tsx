import type { Metadata } from "next";
import Link from "next/link";
import { PollResultsView } from "@/app/ui/poll-results";
import { requireAdmin } from "@/lib/admin-session";
import { listPollsWithResults } from "@/lib/polls";
import { deletePollAction, logout } from "./actions";
import { CreatePollForm } from "./create-poll-form";
import { DeletePollButton } from "./delete-poll-button";

export const metadata: Metadata = { title: "운영자" };

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { created } = await searchParams;
  const polls = await listPollsWithResults();
  const createdPollId =
    typeof created === "string" && polls.some((poll) => poll.id === created) ? created : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">운영자</h1>
        <form action={logout}>
          <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
            로그아웃
          </button>
        </form>
      </header>

      {createdPollId && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-100">
          투표를 만들었습니다.{" "}
          <Link href={`/polls/${createdPollId}`} className="font-medium underline">
            투표 페이지 열기
          </Link>
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">새 투표</h2>
        {/* Remount after each create so the form starts empty. */}
        <CreatePollForm key={createdPollId ?? "new"} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">투표 목록</h2>
          <p className="text-sm text-zinc-500">
            투표는 만든 뒤 수정할 수 없습니다. 잘못 만들었다면 삭제하고 다시 만드세요.
          </p>
        </div>
        {polls.length === 0 ? (
          <p className="text-zinc-500">아직 투표가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {polls.map((poll) => (
              <li
                key={poll.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 px-4 py-4 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/polls/${poll.id}`} className="font-medium hover:underline">
                    {poll.question}
                  </Link>
                  <DeletePollButton
                    action={deletePollAction.bind(null, poll.id)}
                    question={poll.question}
                  />
                </div>
                <details>
                  <summary className="cursor-pointer text-sm text-zinc-600 dark:text-zinc-400">
                    결과 보기 ({poll.results.totalVotes}표)
                  </summary>
                  <div className="pt-3">
                    <PollResultsView results={poll.results} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
