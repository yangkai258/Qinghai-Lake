import { Shell } from "@/components/Shell";
import { ReseedButton } from "./ReseedButton";
import { db } from "@/lib/db";
import { sources } from "@data-tw/db/schema";
import { SourceRow } from "./SourceRow";

export const dynamic = "force-dynamic";

export default async function Page() {
  const rows = await db.select().from(sources);
  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>数据源</h1>
        <ReseedButton />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead><tr>
            <th style={{ width: 140 }}>ID</th>
            <th style={{ width: 200 }}>名称</th>
            <th style={{ width: 90 }}>类型</th>
            <th style={{ width: 90 }}>启用</th>
            <th style={{ width: 130 }}>Cron</th>
            <th>配置</th>
            <th style={{ width: 220 }}>操作</th>
          </tr></thead>
          <tbody>
            {rows.map((s) => (
              <SourceRow key={s.id} source={{
                id: s.id, displayName: s.displayName, kind: s.kind,
                enabled: s.enabled, cronExpr: s.cronExpr ?? "",
                config: s.config as Record<string, unknown>, lastStatus: s.lastStatus, lastError: s.lastError,
              }} />
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}