import { Shell } from "@/components/Shell";

export default function Page() {
  const url = process.env.NEXT_PUBLIC_SUPERSET_BASE ?? "http://localhost:8088";
  return (
    <Shell>
      <h1 style={{ marginTop: 0, fontSize: 24 }}>Superset BI</h1>
      <p style={{ color: "var(--ink-dim)", fontSize: 13 }}>
        把 Superset 嵌在这里，省去再开一个标签。第一次用请在 Superset 里登一次（默认 admin/admin），
        会自动记住登录态。如需在 iframe 里单点登录，可在 .env 设 SUPERSET_LOGIN_API 并扩展 auth.ts。
      </p>
      <div className="card" style={{ padding: 8 }}>
        <iframe src={url} style={{ width: "100%", height: "78vh", border: 0, borderRadius: 8 }} />
      </div>
    </Shell>
  );
}