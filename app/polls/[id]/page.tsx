import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PollResultsView } from "@/app/ui/poll-results";
import { formatKoreaTime } from "@/lib/poll-rules";
import { getPoll, getResults, getVotedOptionId } from "@/lib/polls";
import { readVoterId } from "@/lib/voter";
import { castVoteAction } from "./actions";
import { VoteForm } from "./vote-form";

export async function generateMetadata({ params }: PageProps<"/polls/[id]">): Promise<Metadata> {
  const poll = await getPoll((await params).id);
  return { title: poll?.question ?? "존재하지 않는 투표" };
}

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  const poll = await getPoll((await params).id);
  if (!poll) notFound();

  const votedOptionId = await getVotedOptionId(poll.id, await readVoterId());
  // Results go to voters who have voted, and to everyone once the poll is closed.
  const showResults = votedOptionId !== null || poll.status === "closed";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← 투표 목록
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{poll.question}</h1>
        {poll.status === "closed" ? (
          <p className="self-start rounded-full bg-zinc-200 px-3 py-1 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            마감되었습니다
          </p>
        ) : (
          poll.deadline && (
            <p className="text-sm text-zinc-500">
              {formatKoreaTime(poll.deadline, poll.now)} 마감 (한국 시간)
            </p>
          )
        )}
      </div>
      {showResults ? (
        <PollResultsView results={await getResults(poll.id)} votedOptionId={votedOptionId} />
      ) : (
        <VoteForm poll={poll} action={castVoteAction.bind(null, poll.id)} />
      )}
    </main>
  );
}
