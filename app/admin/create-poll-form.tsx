"use client";

import { useActionState, useState } from "react";
import { MAX_OPTIONS, MIN_OPTIONS } from "@/lib/poll-rules";
import { type CreatePollState, createPollAction } from "./actions";

const initialState: CreatePollState = { status: "idle" };

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function CreatePollForm() {
  const [state, formAction, pending] = useActionState(createPollAction, initialState);
  const errors = state.status === "invalid" ? state.errors : {};
  // Controlled so that what the admin typed survives a failed submit. Without JavaScript the
  // server renders this fresh, so start from the values the action echoed back.
  const submitted = state.status === "idle" ? null : state.values;
  const [question, setQuestion] = useState(submitted?.question ?? "");
  const [optionNames, setOptionNames] = useState<string[]>(
    submitted?.optionNames ?? Array(MIN_OPTIONS).fill(""),
  );

  const setOption = (index: number, value: string) =>
    setOptionNames((current) => current.map((name, i) => (i === index ? value : name)));

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="question" className="text-sm font-medium">
          질문
        </label>
        <input
          id="question"
          name="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: 점심 뭐 먹을까?"
          className={inputClass}
        />
        <FieldError message={errors.question} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">
          선택지 ({MIN_OPTIONS}~{MAX_OPTIONS}개)
        </legend>
        {optionNames.map((name, index) => (
          <div key={index} className="flex gap-2">
            <input
              name="option"
              aria-label={`선택지 ${index + 1}`}
              value={name}
              onChange={(e) => setOption(index, e.target.value)}
              placeholder={`선택지 ${index + 1}`}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setOptionNames((current) => current.filter((_, i) => i !== index))}
              disabled={optionNames.length <= MIN_OPTIONS}
              aria-label={`선택지 ${index + 1} 삭제`}
              className="shrink-0 rounded-lg border border-zinc-300 px-3 text-sm disabled:opacity-30 dark:border-zinc-700"
            >
              삭제
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOptionNames((current) => [...current, ""])}
          disabled={optionNames.length >= MAX_OPTIONS}
          className="self-start rounded-lg border border-dashed border-zinc-400 px-3 py-1.5 text-sm disabled:opacity-30"
        >
          + 선택지 추가
        </button>
        <FieldError message={errors.options} />
      </fieldset>

      {state.status === "failed" && (
        <FieldError message="투표를 저장하지 못했습니다. 잠시 후 다시 시도하세요." />
      )}

      <button
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "만드는 중…" : "투표 만들기"}
      </button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-red-600">{message}</p> : null;
}
