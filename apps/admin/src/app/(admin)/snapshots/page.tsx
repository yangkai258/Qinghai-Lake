import { Shell } from "@/components/Shell";
import { db } from "@/lib/db";
import { accountSnapshots } from "@data-tw/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; entity?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const entity = sp.entity || "";

  const rows = await db.select().from(accountSnapshots)
    .orderBy(desc(accountSnapshots.capturedAt))
    .limit(200);

  const filtered = rows.filter((r) => {
    if (entity && !r.entityId.includes(entity)) return false;
    if (q && !`${r.entityId} ${r.metricName} ${JSON.stringify(r.dims)}`.includes(q)) return false;
    return true;
  });

  return (
    <Shell>
      <h1 style={{ marginTop: 0, fontSize: 24 }}>事实点 (account_snapshots)</h1>
      <form style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input className="input" name="q" placeholder="搜 账号 / 指标 / dims" defaultValue={q} style={{ maxWidth: 360 }} />
        <input className="input" name="entity" placeholder="entity_id 过滤" defaultValue={entity} style={{ maxWidth: 240 }} />
        <button className="btn">查询</button>
      </form>

      <div className="card" style={{ padding: 0, overflow: "auto", maxHeight: "70vh" }}>
        <table className="table">
          <thead><tr>
            <th>captured_at</th><th>entity</th><th>kind</th><th>metric</th><th>value</th><th>dims</th><th>source</th>
          </tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={String(r.id)}>
                <td style={{ color: "var(--ink-dim)" }}>{new Date(r.capturedAt).toLocaleString("zh-CN", { hour12: false })}</td>
                <td className="mono">{r.entityId}</td>
                <td><span className="tag muted">{r.entityKind}</span></td>
                <td className="mono">{r.metricName}</td>
                <td className="mono">{r.metricValue ?? "—"}</td>
                <td className="mono" style={{ color: "var(--ink-dim)", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{JSON.stringify(r.dims)}</td>
                <td className="mono" style={{ color: "var(--ink-dim)" }}>{r.sourceId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ color: "var(--ink-dim)", fontSize: 12, marginTop: 8 }}>显示前 200 条，按 captured_at desc</div>
    </Shell>
  );
}