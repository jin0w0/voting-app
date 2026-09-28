"use client";

const tones = {
  danger:
    "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950",
  neutral:
    "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900",
};

// A server action behind a browser confirm() dialog.
export function ConfirmButton({
  action,
  confirmMessage,
  label,
  tone,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
  tone: keyof typeof tones;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm ${tones[tone]}`}>
        {label}
      </button>
    </form>
  );
}
