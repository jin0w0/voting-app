"use client";

import { useActionState } from "react";
import type { Poll } from "@/lib/polls";
import type { VoteState } from "./actions";

const initialState: VoteState = { status: "idle" };

const messages: Record<VoteState["status"], string | null> = {
  idle: null,
  "no-option": "선택지를 하나 고르세요.",
  "invalid-option": "이 투표에 없는 선택지입니다. 페이지를 새로고침하세요.",
  "poll-missing": "존재하지 않는 투표입니다. 삭제되었을 수 있습니다.",
  failed: "투표를 저장하지 못했습니다. 잠시 후 다시 시도하세요.",
};

export function VoteForm({
  poll,
  action,
}: {
  poll: Poll;
  action: (prev: VoteState, formData: FormData) => Promise<VoteState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const message = messages[state.status];

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">선택지</legend>
        {poll.options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 has-checked:border-zinc-900 has-checked:bg-zinc-50 dark:border-zinc-800 dark:has-checked:border-zinc-100 dark:has-checked:bg-zinc-900"
          >
            <input type="radio" name="optionId" value={option.id} required className="size-4" />
            {option.name}
          </label>
        ))}
      </fieldset>
      {message && (
        <p aria-live="polite" className="text-sm text-red-600">
          {message}
        </p>
      )}
      <button
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "투표하는 중…" : "투표하기"}
      </button>
    </form>
  );
}
