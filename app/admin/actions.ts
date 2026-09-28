"use server";

import { redirect } from "next/navigation";
import { endAdminSession, requireAdmin, startAdminSession } from "@/lib/admin-session";
import {
  DUPLICATE_OPTION_ERROR,
  type PollInput,
  type PollInputErrors,
  validatePollInput,
} from "@/lib/poll-rules";
import { type CreatePollResult, createPoll, deletePoll } from "@/lib/polls";

export type LoginState = { error: string | null };

// `values` echoes what was submitted so the form can refill itself, even without JavaScript.
export type CreatePollState =
  | { status: "idle" }
  | { status: "invalid"; errors: PollInputErrors; values: PollInput }
  | { status: "failed"; values: PollInput };

export async function createPollAction(
  _prev: CreatePollState,
  formData: FormData,
): Promise<CreatePollState> {
  await requireAdmin();

  const values: PollInput = {
    question: String(formData.get("question") ?? ""),
    optionNames: formData.getAll("option").map(String),
  };
  const result = validatePollInput(values.question, values.optionNames);
  if (!result.ok) return { status: "invalid", errors: result.errors, values };

  let created: CreatePollResult;
  try {
    created = await createPoll(result.poll);
  } catch (error) {
    console.error("Failed to create poll", error);
    return { status: "failed", values };
  }
  if (!created.ok) {
    return { status: "invalid", errors: { options: DUPLICATE_OPTION_ERROR }, values };
  }
  redirect(`/admin?created=${created.id}`);
}

export async function deletePollAction(pollId: string): Promise<void> {
  await requireAdmin();
  await deletePoll(pollId);
  // A fresh load also drops any ?created= banner that pointed at this poll.
  redirect("/admin");
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!(await startAdminSession(password))) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}
