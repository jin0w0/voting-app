import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPoll } from "@/lib/polls";

export async function generateMetadata({ params }: PageProps<"/polls/[id]">): Promise<Metadata> {
  const poll = await getPoll((await params).id);
  return { title: poll?.question ?? "존재하지 않는 투표" };
}

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  const poll = await getPoll((await params).id);
  if (!poll) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← 투표 목록
      </Link>
      <h1 className="text-2xl font-bold">{poll.question}</h1>
      <ul className="flex flex-col gap-2">
        {poll.options.map((option) => (
          <li
            key={option.id}
            className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            {option.name}
          </li>
        ))}
      </ul>
    </main>
  );
}
