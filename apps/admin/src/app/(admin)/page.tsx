import { Shell } from "@/components/Shell";
import { db } from "@/lib/db";
import { sources, ingestionRuns, accountSnapshots } from "@data-tw/db/schema";
import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [srcs, lastRuns, snapCount, view] = await Promise.all([
    db.select().from(sources),
    db.select().from(ingestionRuns).orderBy(desc(ingestionRuns.finishedAt)).limit(10),
    db.select({ n: sql<number>`count(*)::int` }).from(accountSnapshots),
    db.execute(sql`SELECT COUNT(DISTINCT entity_id)::int AS accounts, MAX(captured_at) AS captured_at FROM account_snapshots WHERE entity_kind = ${'douyin_account'}`),
  ]);

  const acct = (view as unknown as Array<{ accounts: number; captured_at: string }>)[0] ?? { accounts: 0, captured_at: null };

  return (
    <Shell>
      <h1 style={{ marginTop: 0, fontSize: 24 }}>概览</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <Card title="数据源" value={srcs.length} sub={`${srcs.filter((s) => s.enabled).length} 已启用`} />
        <Card title="账号数" value={acct.accounts} sub="抖音账号" />
        <Card title="事实点" value={snapCount[0]?.n ?? 0} sub="account_snapshots" />
        <Card title="最近抓取" value={new Date(acct.captured_at ?? Date.now()).toLocaleString("zh-CN", { hour12: false })} sub="captured_at" small />
      </div>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>数据源状态</h2>
      <div className="card" style={{ marginTop: 12, padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead><tr>
            <th>ID</th><th>名称</th><th>类型</th><th>启用</th><th>Cron</th><th>上次状态</th><th>上次运行</th>
          </tr></thead>
          <tbody>
            {srcs.map((s) => (
              <tr key={s.id}>
                <td className="mono">{s.id}</td>
                <td>{s.displayName}</td>
                <td><span className="tag muted">{s.kind}</span></td>
                <td>{s.enabled ? <span className="tag good">启用</span> : <span className="tag muted">关</span>}</td>
                <td className="mono" style={{ color: "var(--ink-dim)" }}>{s.cronExpr ?? "—"}</td>
                <td>{s.lastStatus === "ok" ? <span className="tag good">ok</span> : s.lastStatus === "error" ? <span className="tag bad">error</span> : <span className="tag muted">—</span>}</td>
                <td style={{ color: "var(--ink-dim)" }}>{s.lastRunAt ? new Date(s.lastRunAt).toLocaleString("zh-CN", { hour12: false }) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>最近运行日志</h2>
      <div className="card" style={{ marginTop: 12, padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead><tr>
            <th>source_id</th><th>started</th><th>finished</th><th>rows</th><th>status</th><th>error</th>
          </tr></thead>
          <tbody>
            {lastRuns.map((r) => (
              <tr key={String(r.id)}>
                <td className="mono">{r.sourceId}</td>
                <td style={{ color: "var(--ink-dim)" }}>{new Date(r.startedAt).toLocaleString("zh-CN", { hour12: false })}</td>
                <td style={{ color: "var(--ink-dim)" }}>{new Date(r.finishedAt).toLocaleString("zh-CN", { hour12: false })}</td>
                <td className="mono">{r.rowsWritten}</td>
                <td>{r.status === "ok" ? <span className="tag good">ok</span> : <span className="tag bad">error</span>}</td>
                <td style={{ color: "var(--ink-dim)", maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis" }}>{r.errorText ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

function Card({ title, value, sub, small }: { title: string; value: number | string; sub?: string; small?: boolean }) {
  return (
    <div className="card">
      <div style={{ color: "var(--ink-dim)", fontSize: 12 }}>{title}</div>
      <div className="mono" style={{ fontSize: small ? 16 : 28, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {sub ? <div style={{ color: "var(--ink-dim)", fontSize: 12, marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
}