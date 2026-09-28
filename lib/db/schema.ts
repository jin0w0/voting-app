import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const polls = pgTable("polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Null: no deadline, the poll stays open until closed early or deleted.
  deadline: timestamp("deadline", { withTimezone: true }),
});

export const options = pgTable(
  "options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [uniqueIndex("options_poll_id_name_key").on(t.pollId, sql`lower(${t.name})`)],
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => options.id, { onDelete: "cascade" }),
    // Anonymous id from the voter's browser cookie (ADR-0001).
    voterId: uuid("voter_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("votes_poll_id_voter_id_key").on(t.pollId, t.voterId)],
);
