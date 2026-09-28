"use server";

import { redirect } from "next/navigation";
import { endAdminSession, requireAdmin, startAdminSession } from "@/lib/admin-session";
import {
  DUPLICATE_OPTION_ERROR,
  type PollForm,
  type PollInputErrors,
  validatePollInput,
} from "@/lib/poll-rules";
import { closePoll, type CreatePollResult, createPoll, deletePoll, getDbNow } from "@/lib/polls";

export type LoginState = { status: "idle" | "wrong-password" };

// `values` echoes what was submitted so the form can refill itself, even without JavaScript.
export type CreatePollState =
  | { status: "idle" }
  | { status: "invalid"; errors: PollInputErrors; values: PollForm }
  | { status: "failed"; values: PollForm };

export async function createPollAction(
  _prev: CreatePollState,
  formData: FormData,
): Promise<CreatePollState> {
  await requireAdmin();

  const values: PollForm = {
    question: String(formData.get("question") ?? ""),
    optionNames: formData.getAll("option").map(String),
    deadline: formData.get("hasDeadline") ? String(formData.get("deadline") ?? "") : null,
  };

  let created: CreatePollResult;
  try {
    // Check a deadline on the same clock that will later decide the poll has closed.
    const result = validatePollInput(values, values.deadline === null ? new Date() : await getDbNow());
    if (!result.ok) return { status: "invalid", errors: result.errors, values };
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

export async function closePollAction(pollId: string): Promise<void> {
  await requireAdmin();
  await closePoll(pollId);
  redirect("/admin");
}

export async function deletePollAction(pollId: string): Promise<void> {
  await requireAdmin();
  await deletePoll(pollId);
  // A fresh load also drops any ?created= banner that pointed at this poll.
  redirect("/admin");
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!(await startAdminSession(password))) {
    return { status: "wrong-password" };
  }
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}
