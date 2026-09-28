import Link from "next/link";

export default function PollNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">존재하지 않는 투표입니다</h1>
      <p className="text-zinc-500">링크가 잘못되었거나 투표가 삭제되었을 수 있습니다.</p>
      <Link href="/" className="self-start text-sm underline">
        투표 목록으로
      </Link>
    </main>
  );
}
