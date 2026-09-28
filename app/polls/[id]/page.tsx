import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PollResultsView } from "@/app/ui/poll-results";
import { PollStatusLabel } from "@/app/ui/poll-status-label";
import { getPoll, getResults, getVotedOptionId } from "@/lib/polls";
import { readVoterId } from "@/lib/voter";
import { castVoteAction } from "./actions";
import { VoteForm } from "./vote-form";

export async function generateMetadata({ params }: PageProps<"/polls/[id]">): Promise<Metadata> {
  const poll = await getPoll((await params).id);
  return { title: poll?.question ?? "존재하지 않는 투표" };
}

export default async function PollPage({ params, searchParams }: PageProps<"/polls/[id]">) {
  const poll = await getPoll((await params).id);
  if (!poll) notFound();

  const votedOptionId = await getVotedOptionId(poll.id, await readVoterId());
  // Results go to voters who have voted, and to everyone once the poll is closed.
  const showResults = votedOptionId !== null || poll.status === "closed";
  // Set by the vote action when a vote arrived after the poll closed.
  const lateVote = (await searchParams).late !== undefined && votedOptionId === null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← 투표 목록
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{poll.question}</h1>
        <div className="flex">
          <PollStatusLabel poll={poll} large />
        </div>
      </div>
      {lateVote && poll.status === "closed" && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          이 투표는 마감되어 표가 기록되지 않았습니다.
        </p>
      )}
      {showResults ? (
        <PollResultsView results={await getResults(poll.id)} votedOptionId={votedOptionId} />
      ) : (
        <VoteForm poll={poll} action={castVoteAction.bind(null, poll.id)} />
      )}
    </main>
  );
}
