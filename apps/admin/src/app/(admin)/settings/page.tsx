import { Shell } from "@/components/Shell";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await requireSession();
  return (
    <Shell>
      <h1 style={{ marginTop: 0, fontSize: 24 }}>设置</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>账号信息</h3>
        <p style={{ color: "var(--ink-dim)", fontSize: 13 }}>{s.email} · {s.role}</p>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>修改密码</h3>
        <form action="/api/auth/password" method="post" style={{ display: "grid", gap: 12, maxWidth: 360 }}>
          <input className="input" name="oldPassword" type="password" placeholder="当前密码" required />
          <input className="input" name="newPassword" type="password" placeholder="新密码 (≥ 8 位)" required minLength={8} />
          <button className="btn">保存</button>
        </form>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>系统信息</h3>
        <table className="table">
          <tbody>
            <tr><td>Admin URL</td><td className="mono">http://&lt;host&gt;:3004</td></tr>
            <tr><td>Dashboard URL</td><td className="mono">http://&lt;host&gt;:3003</td></tr>
            <tr><td>Postgres</td><td className="mono">postgres://postgres@&lt;host&gt;:5432/dashboard</td></tr>
            <tr><td>Superset</td><td className="mono">http://&lt;host&gt;:8088</td></tr>
          </tbody>
        </table>
      </div>
    </Shell>
  );
}