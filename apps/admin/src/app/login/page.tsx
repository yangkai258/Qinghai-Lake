import { LoginForm } from "./LoginForm";
import { countUsers, createUser, newUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ setup?: string }> }) {
  const sp = await searchParams;
  const needSetup = (await countUsers()) === 0;
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-0)" }}>
      <div className="card" style={{ width: 400, padding: 28 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>data-tw · 管理后台</h1>
        <p style={{ color: "var(--ink-dim)", fontSize: 13, marginTop: 4 }}>
          {needSetup ? "首次启动 — 创建超级管理员" : "请登录"}
        </p>
        {needSetup ? (
          <SetupForm />
        ) : (
          <LoginForm from={sp.setup} />
        )}
      </div>
    </div>
  );
}

async function SetupForm() {
  return (
    <form action="/api/auth/setup" method="post" style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <input className="input" name="email" type="email" placeholder="email" required defaultValue="admin@local" />
      <input className="input" name="password" type="password" placeholder="密码 (≥ 8 位)" required minLength={8} />
      <button className="btn" type="submit">创建并登录</button>
    </form>
  );
}