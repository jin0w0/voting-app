"use client";

import { useActionState } from "react";
import { primaryButton } from "@/app/ui/styles";
import { loginAction, type LoginState } from "../actions";

const initialState: LoginState = { status: "idle" };

const messages: Record<LoginState["status"], string | null> = {
  idle: null,
  "wrong-password": "비밀번호가 올바르지 않습니다.",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="password" className="text-sm font-medium">
        비밀번호
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <p aria-live="polite" className="min-h-5 text-sm text-red-600">
        {messages[state.status]}
      </p>
      <button
        disabled={pending}
        className={primaryButton}
      >
        {pending ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
