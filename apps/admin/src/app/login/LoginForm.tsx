"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm({ from }: { from?: string }) {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = from || sp.get("from") || "/";
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setErr(null);
        const fd = new FormData(e.currentTarget);
        const r = await fetch("/api/auth/login", { method: "POST", body: fd });
        setBusy(false);
        if (r.ok) router.push(redirect);
        else { const t = await r.text(); setErr(t || "登录失败"); }
      }}
      style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}
    >
      <input className="input" name="email" type="email" placeholder="email" required />
      <input className="input" name="password" type="password" placeholder="密码" required />
      <button className="btn" type="submit" disabled={busy}>{busy ? "..." : "登录"}</button>
      {err ? <div style={{ color: "var(--bad)", fontSize: 13 }}>{err}</div> : null}
    </form>
  );
}