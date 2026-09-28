import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PollResultsView } from "@/app/ui/poll-results";
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

  // Results are only sent to voters who have voted in this poll.
  const votedOptionId = await getVotedOptionId(poll.id, await readVoterId());

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← 투표 목록
      </Link>
      <h1 className="text-2xl font-bold">{poll.question}</h1>
      {votedOptionId ? (
        <PollResultsView results={await getResults(poll.id)} votedOptionId={votedOptionId} />
      ) : (
        <VoteForm poll={poll} action={castVoteAction.bind(null, poll.id)} />
      )}
    </main>
  );
}
