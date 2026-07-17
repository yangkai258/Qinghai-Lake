"use client";
import { useRouter } from "next/navigation";

export function ReseedButton() {
  const router = useRouter();
  return (
    <form action="/api/reseed" method="post">
      <button className="btn ghost sm" type="submit" onClick={(e) => { if (!confirm("会清空所有现有 mock 数据并重灌。继续？")) e.preventDefault(); }}>
        重灌 mock 数据
      </button>
    </form>
  );
}
