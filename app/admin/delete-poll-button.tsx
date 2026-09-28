"use client";

export function DeletePollButton({ action, question }: { action: () => Promise<void>; question: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`"${question}" 투표를 삭제할까요?\n선택지와 표도 모두 사라지고 되돌릴 수 없습니다.`)) {
          e.preventDefault();
        }
      }}
    >
      <button className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
        삭제
      </button>
    </form>
  );
}
