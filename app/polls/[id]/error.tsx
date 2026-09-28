"use client";

import { primaryButton } from "@/app/ui/styles";

// Shown when a vote cannot reach the server at all (e.g. the network dropped).
export default function PollError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">문제가 생겼습니다</h1>
      <p className="text-zinc-500">표를 보내지 못했습니다. 연결을 확인하고 다시 시도하세요.</p>
      <button onClick={() => retry()} className={"self-start " + primaryButton}>
        다시 시도
      </button>
    </main>
  );
}
