import { randomUUID } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import { db } from "./db";
import { options, polls } from "./db/schema";
import type { PollInput } from "./poll-rules";

export type PollSummary = { id: string; question: string };

export type Poll = PollSummary & { options: { id: string; name: string }[] };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Newest first. Always read at request time, never at build time.
export async function listPolls(): Promise<PollSummary[]> {
  await connection();
  return db
    .select({ id: polls.id, question: polls.question })
    .from(polls)
    .orderBy(desc(polls.createdAt), desc(polls.id));
}

// Returns null for an unknown or malformed id. Always read at request time;
// cached per request so metadata and page share one lookup.
export const getPoll = cache(async (id: string): Promise<Poll | null> => {
  await connection();
  if (!UUID_PATTERN.test(id)) return null;
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
    if (isUniqueViolation(error)) return { ok: false, reason: "duplicate-option" };
    throw error;
  }
  return { ok: true, id };
}

function isUniqueViolation(error: unknown): boolean {
  for (let e = error; e instanceof Error; e = e.cause) {
    if ((e as { code?: string }).code === "23505") return true;
  }
  return false;
}
