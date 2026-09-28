import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-session";
import { logout } from "./actions";

export const metadata: Metadata = { title: "운영자" };

export default async function AdminPage() {
  await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">운영자</h1>
        <form action={logout}>
          <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
            로그아웃
          </button>
        </form>
      </header>
    </main>
  );
}
