import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, isNull, sql } from "drizzle-orm";
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

// Where a poll stands, judged on the database clock; now is kept for formatting its deadline.
export type PollState = { deadline: Date | null; status: PollStatus; now: Date };

type PollBase = PollState & { id: string; question: string };

export type PollSummary = PollBase & { totalVotes: number };

export type Poll = PollBase & { options: { id: string; name: string }[] };

export type PollWithResults = PollBase & { results: PollResults };

// The database clock: every open/closed decision uses it, never the app server's clock.
// mapWith(createdAt) reuses that timestamptz column's decoder to turn the value into a Date.
const dbNow = sql<Date>`now()`.mapWith(polls.createdAt);

// The database clock on its own, e.g. to check a new deadline against the same clock
// that will later decide the poll has closed.
export async function getDbNow(): Promise<Date> {
  const { rows } = await db.execute<{ now: string }>(sql`select now() as now`);
  return new Date(rows[0].now);
}

// Everything pollStatus() needs, read in the same query as the poll.
const statusColumns = { deadline: polls.deadline, closedAt: polls.closedAt, now: dbNow };

// A poll row as every read needs it: identity plus what decides its status.
const pollColumns = { ...statusColumns, id: polls.id, question: polls.question };

function withStatus<T extends { deadline: Date | null; closedAt: Date | null; now: Date }>(
  row: T,
): T & { status: PollStatus } {
  return { ...row, status: pollStatus(row, row.now) };
}

const NEWEST_FIRST = [desc(polls.createdAt), desc(polls.id)];

// Newest first. Always read at request time, never at build time.
export async function listPolls(): Promise<PollSummary[]> {
  await connection();
  const rows = await db
    .select({ ...pollColumns, totalVotes: count(votes.id) })
    .from(polls)
    .leftJoin(votes, eq(votes.pollId, polls.id))
    .groupBy(polls.id)
    .orderBy(...NEWEST_FIRST);
  return openFirst(rows.map(withStatus));
}

// Open polls before closed ones; the sort is stable, so each group stays newest first.
function openFirst<T extends { status: PollStatus }>(list: T[]): T[] {
  return list.toSorted((a, b) => Number(a.status === "closed") - Number(b.status === "closed"));
}

// Returns null for an unknown or malformed id. Always read at request time;
// cached per request so metadata and page share one lookup.
export const getPoll = cache(async (id: string): Promise<Poll | null> => {
  await connection();
  if (!isUuid(id)) return null;
  const [poll] = await db
    .select(pollColumns)
    .from(polls)
    .where(eq(polls.id, id));
  if (!poll) return null;
  const pollOptions = await db
    .select({ id: options.id, name: options.name })
    .from(options)
    .where(eq(options.pollId, id))
    .orderBy(asc(options.position));
  return { ...withStatus(poll), options: pollOptions };
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
  voterId: string | null,
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

  // The option, if it belongs to this poll, with the poll's status.
  const [target] = await db
    .select({ ...statusColumns, id: options.id })
    .from(options)
    .innerJoin(polls, eq(polls.id, options.pollId))
    .where(and(eq(options.id, optionId), eq(options.pollId, pollId)));
  if (!target) return (await pollExists(pollId)) ? "invalid-option" : "poll-missing";
  if (withStatus(target).status === "closed") return "closed";

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

// Every poll with its results, newest first, for the admin (who may see results without voting).
export async function listPollsWithResults(): Promise<PollWithResults[]> {
  await connection();
  const [pollRows, optionRows] = await db.batch([
    db
      .select(pollColumns)
      .from(polls)
      .orderBy(...NEWEST_FIRST),
    optionVoteCounts(),
  ]);
  return openFirst(
    pollRows.map((poll) => ({
      ...withStatus(poll),
      results: toResults(optionRows.filter((option) => option.pollId === poll.id)),
    })),
  );
}

// Closes an open poll now; a poll that is already closed (early or by its deadline) is left as is.
// pollStatus() decides; `closed_at IS NULL` only keeps two racing requests from both writing.
export async function closePoll(id: string): Promise<void> {
  if (!isUuid(id)) return;
  const [poll] = await db.select(statusColumns).from(polls).where(eq(polls.id, id));
  if (!poll || withStatus(poll).status === "closed") return;
  await db
    .update(polls)
    .set({ closedAt: sql`now()` })
    .where(and(eq(polls.id, id), isNull(polls.closedAt)));
}

// Deletes the poll; its options and votes go with it (ON DELETE CASCADE).
export async function deletePoll(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await db.delete(polls).where(eq(polls.id, id));
}
