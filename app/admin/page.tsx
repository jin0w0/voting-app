import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import { logout } from "./actions";
import { CreatePollForm } from "./create-poll-form";

export const metadata: Metadata = { title: "운영자" };

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { created } = await searchParams;
  const createdPollId = typeof created === "string" ? created : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">운영자</h1>
        <form action={logout}>
          <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
            로그아웃
          </button>
        </form>
      </header>

      {createdPollId && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-100">
          투표를 만들었습니다.{" "}
          <Link href={`/polls/${createdPollId}`} className="font-medium underline">
            투표 페이지 열기
          </Link>
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">새 투표</h2>
        {/* Remount after each create so the form starts empty. */}
        <CreatePollForm key={createdPollId ?? "new"} />
      </section>
    </main>
  );
}
