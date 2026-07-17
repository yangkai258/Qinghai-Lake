import { Shell } from "@/components/Shell";
import { db } from "@/lib/db";
import { ingestionRuns } from "@data-tw/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Page() {
  const rows = await db.select().from(ingestionRuns).orderBy(desc(ingestionRuns.finishedAt)).limit(200);
  return (
    <Shell>
      <h1 style={{ marginTop: 0, fontSize: 24 }}>运行日志 (ingestion_runs)</h1>
      <div className="card" style={{ padding: 0, overflow: "auto", maxHeight: "80vh" }}>
        <table className="table">
          <thead><tr>
            <th>started</th><th>finished</th><th>source</th><th>rows</th><th>status</th><th>error</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)}>
                <td style={{ color: "var(--ink-dim)" }}>{new Date(r.startedAt).toLocaleString("zh-CN", { hour12: false })}</td>
                <td style={{ color: "var(--ink-dim)" }}>{new Date(r.finishedAt).toLocaleString("zh-CN", { hour12: false })}</td>
                <td className="mono">{r.sourceId}</td>
                <td className="mono">{r.rowsWritten}</td>
                <td>{r.status === "ok" ? <span className="tag good">ok</span> : <span className="tag bad">error</span>}</td>
                <td style={{ color: "var(--ink-dim)", maxWidth: 480, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.errorText ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}