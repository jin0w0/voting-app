import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import { db } from "./db";
import { isUuid } from "./ids";
import { options, polls, votes } from "./db/schema";
import { computeResults, type PollInput, type Results } from "./poll-rules";

export type PollSummary = { id: string; question: string; totalVotes: number };

export type Poll = { id: string; question: string; options: { id: string; name: string }[] };

// Newest first. Always read at request time, never at build time.
export async function listPolls(): Promise<PollSummary[]> {
  await connection();
  return db
    .select({ id: polls.id, question: polls.question, totalVotes: count(votes.id) })
    .from(polls)
    .leftJoin(votes, eq(votes.pollId, polls.id))
    .groupBy(polls.id)
    .orderBy(desc(polls.createdAt), desc(polls.id));
}

// Returns null for an unknown or malformed id. Always read at request time;
// cached per request so metadata and page share one lookup.
export const getPoll = cache(async (id: string): Promise<Poll | null> => {
  await connection();
  if (!isUuid(id)) return null;
  const poll = await db.query.polls.findFirst({ where: eq(polls.id, id) });
  if (!poll) return null;
  const pollOptions = await db
    .select({ id: options.id, name: options.name })
    .from(options)
    .where(eq(options.pollId, id))
    .orderBy(asc(options.position));
  return { id: poll.id, question: poll.question, options: pollOptions };
});

export type CreatePollResult = { ok: true; id: string } | { ok: false; reason: "duplicate-option" };

// Saves the poll and its options together.
export async function createPoll(input: PollInput): Promise<CreatePollResult> {
  const id = randomUUID();
  try {
    await db.batch([
      db.insert(polls).values({ id, question: input.question }),
      db.insert(options).values(
        input.optionNames.map((name, position) => ({ pollId: id, name, position })),
      ),
    ]);
  } catch (error) {
    // The database's case-insensitive rule can catch duplicates the app's check missed.
    if (hasPostgresCode(error, UNIQUE_VIOLATION)) return { ok: false, reason: "duplicate-option" };
    throw error;
  }
  return { ok: true, id };
}

// The option this voter picked in this poll, or null if they have not voted.
export async function getVotedOptionId(
  pollId: string,
  voterId: string | undefined,
): Promise<string | null> {
  if (!voterId) return null;
  const [vote] = await db
    .select({ optionId: votes.optionId })
    .from(votes)
    .where(and(eq(votes.pollId, pollId), eq(votes.voterId, voterId)));
  return vote?.optionId ?? null;
}

export type PollResults = Results<{ id: string; name: string; votes: number }>;

// Results in the poll's option order.
export async function getResults(poll: Poll): Promise<PollResults> {
  const rows = await db
    .select({ optionId: votes.optionId, votes: count() })
    .from(votes)
    .where(eq(votes.pollId, poll.id))
    .groupBy(votes.optionId);
  const counts = new Map(rows.map((row) => [row.optionId, row.votes]));
  return computeResults(poll.options.map((o) => ({ ...o, votes: counts.get(o.id) ?? 0 })));
}

export type CastVoteResult = "voted" | "already-voted" | "poll-missing" | "invalid-option";

export async function castVote(
  pollId: string,
  optionId: string,
  voterId: string,
): Promise<CastVoteResult> {
  if (!isUuid(pollId)) return "poll-missing";
  if (!isUuid(optionId)) return "invalid-option";

  const [option] = await db
    .select({ id: options.id })
    .from(options)
    .where(and(eq(options.id, optionId), eq(options.pollId, pollId)));
  if (!option) return (await pollExists(pollId)) ? "invalid-option" : "poll-missing";

  try {
    await db.insert(votes).values({ pollId, optionId, voterId });
  } catch (error) {
    // The unique index makes double submits safe; a poll deleted since the check fails its foreign key.
    if (hasPostgresCode(error, UNIQUE_VIOLATION)) return "already-voted";
    if (hasPostgresCode(error, FOREIGN_KEY_VIOLATION)) return "poll-missing";
    throw error;
  }
  return "voted";
}

async function pollExists(id: string): Promise<boolean> {
  const [row] = await db.select({ id: polls.id }).from(polls).where(eq(polls.id, id));
  return row !== undefined;
}

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

function hasPostgresCode(error: unknown, code: string): boolean {
  for (let e = error; e instanceof Error; e = e.cause) {
    if ((e as { code?: string }).code === code) return true;
  }
  return false;
}
