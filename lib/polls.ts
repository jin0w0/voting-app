import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import { db } from "./db";
import { isUuid } from "./ids";
import { options, polls, votes } from "./db/schema";
import {
  computeResults,
  type PollInput,
  type PollStatus,
  pollStatus,
  type Results,
} from "./poll-rules";

export type PollSummary = { id: string; question: string; totalVotes: number };

export type Poll = {
  id: string;
  question: string;
  options: { id: string; name: string }[];
  deadline: Date | null;
  status: PollStatus;
  // The database clock at read time, for formatting relative to "now".
  now: Date;
};

// The database clock: every open/closed decision uses it, never the app server's clock.
// mapWith(createdAt) reuses that timestamptz column's decoder to turn the value into a Date.
const dbNow = sql<Date>`now()`.mapWith(polls.createdAt);

// Everything pollStatus() needs, read in the same query as the poll.
const statusColumns = { deadline: polls.deadline, closedAt: polls.closedAt, now: dbNow };

const NEWEST_FIRST = [desc(polls.createdAt), desc(polls.id)];

// Newest first. Always read at request time, never at build time.
export async function listPolls(): Promise<PollSummary[]> {
  await connection();
  return db
    .select({ id: polls.id, question: polls.question, totalVotes: count(votes.id) })
    .from(polls)
    .leftJoin(votes, eq(votes.pollId, polls.id))
    .groupBy(polls.id)
    .orderBy(...NEWEST_FIRST);
}

// Returns null for an unknown or malformed id. Always read at request time;
// cached per request so metadata and page share one lookup.
export const getPoll = cache(async (id: string): Promise<Poll | null> => {
  await connection();
  if (!isUuid(id)) return null;
  const [poll] = await db
    .select({ ...statusColumns, id: polls.id, question: polls.question })
    .from(polls)
    .where(eq(polls.id, id));
  if (!poll) return null;
  const pollOptions = await db
    .select({ id: options.id, name: options.name })
    .from(options)
    .where(eq(options.pollId, id))
    .orderBy(asc(options.position));
  return { ...poll, options: pollOptions, status: pollStatus(poll, poll.now) };
});

export type CreatePollResult = { ok: true; id: string } | { ok: false; reason: "duplicate-option" };

// Saves the poll and its options together.
export async function createPoll(input: PollInput): Promise<CreatePollResult> {
  const id = randomUUID();
  try {
    await db.batch([
      db.insert(polls).values({ id, question: input.question, deadline: input.deadline }),
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

export async function getResults(pollId: string): Promise<PollResults> {
  return toResults(await optionVoteCounts(pollId));
}

// Vote count per option in option order, for one poll or (no id) every poll.
function optionVoteCounts(pollId?: string) {
  return db
    .select({ pollId: options.pollId, id: options.id, name: options.name, votes: count(votes.id) })
    .from(options)
    .leftJoin(votes, eq(votes.optionId, options.id))
    .where(pollId ? eq(options.pollId, pollId) : undefined)
    .groupBy(options.id)
    .orderBy(asc(options.position));
}

function toResults(rows: { id: string; name: string; votes: number }[]): PollResults {
  return computeResults(rows.map(({ id, name, votes }) => ({ id, name, votes })));
}

export type CastVoteResult = "voted" | "already-voted" | "poll-missing" | "invalid-option" | "closed";

export async function castVote(
  pollId: string,
  optionId: string,
  voterId: string,
): Promise<CastVoteResult> {
  if (!isUuid(pollId)) return "poll-missing";
  if (!isUuid(optionId)) return "invalid-option";

  const [option] = await db
    .select({ ...statusColumns, id: options.id })
    .from(options)
    .innerJoin(polls, eq(polls.id, options.pollId))
    .where(and(eq(options.id, optionId), eq(options.pollId, pollId)));
  if (!option) return (await pollExists(pollId)) ? "invalid-option" : "poll-missing";
  if (pollStatus(option, option.now) === "closed") return "closed";

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

export type PollWithResults = {
  id: string;
  question: string;
  deadline: Date | null;
  status: PollStatus;
  now: Date;
  results: PollResults;
};

// Every poll with its results, newest first, for the admin (who may see results without voting).
export async function listPollsWithResults(): Promise<PollWithResults[]> {
  await connection();
  const [pollRows, optionRows] = await db.batch([
    db
      .select({ ...statusColumns, id: polls.id, question: polls.question })
      .from(polls)
      .orderBy(...NEWEST_FIRST),
    optionVoteCounts(),
  ]);
  return pollRows.map((poll) => ({
    ...poll,
    status: pollStatus(poll, poll.now),
    results: toResults(optionRows.filter((option) => option.pollId === poll.id)),
  }));
}

// Closes an open poll now; a poll that is already closed (early or by its deadline) is left as is.
export async function closePoll(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await db
    .update(polls)
    .set({ closedAt: sql`now()` })
    .where(
      and(
        eq(polls.id, id),
        isNull(polls.closedAt),
        or(isNull(polls.deadline), gt(polls.deadline, sql`now()`)),
      ),
    );
}

// Deletes the poll; its options and votes go with it (ON DELETE CASCADE).
export async function deletePoll(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await db.delete(polls).where(eq(polls.id, id));
}
