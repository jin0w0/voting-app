"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { castVote } from "@/lib/polls";
import { readVoterId, saveVoterId } from "@/lib/voter";

export type VoteState = {
  status: "idle" | "no-option" | "invalid-option" | "poll-missing" | "failed";
};

export async function castVoteAction(
  pollId: string,
  _prev: VoteState,
  formData: FormData,
): Promise<VoteState> {
  const optionId = formData.get("optionId");
  if (typeof optionId !== "string" || optionId === "") return { status: "no-option" };

  const existingVoterId = await readVoterId();
  const voterId = existingVoterId ?? randomUUID();

  let result;
  try {
    result = await castVote(pollId, optionId, voterId);
  } catch (error) {
    console.error("Failed to cast vote", error);
    return { status: "failed" };
  }
  if (result === "poll-missing" || result === "invalid-option") return { status: result };

  // "voted" and "already-voted" both land on the results.
  if (!existingVoterId) await saveVoterId(voterId);
  redirect(`/polls/${pollId}`);
}
