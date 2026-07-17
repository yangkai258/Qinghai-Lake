import { Shell } from "@/components/Shell";
import { db } from "@/lib/db";
import { alertRules, alerts } from "@data-tw/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [rules, recentAlerts] = await Promise.all([
    db.select().from(alertRules),
    db.select().from(alerts).orderBy(desc(alerts.firedAt)).limit(50),
  ]);
  const openAlerts = recentAlerts.filter((a) => !a.resolved);

  return (
    <Shell>
      <h1 style={{ marginTop: 0, fontSize: 24 }}>告警规则 & 当前告警</h1>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16 }}>规则列表 ({rules.length})</h2>
          <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 8 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>kind</th>
                  <th>threshold</th>
                  <th>severity</th>
                  <th>scope</th>
                  <th>启用</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td className="mono" style={{ fontSize: 12, color: "var(--ink-dim)" }}>{r.kind}</td>
                    <td className="mono">{r.threshold}</td>
                    <td><span className={r.severity === "bad" ? "tag bad" : r.severity === "warn" ? "tag warn" : "tag muted"}>{r.severity}</span></td>
                    <td className="mono" style={{ fontSize: 12 }}>{r.scope}</td>
                    <td>{r.enabled === "true" ? <span className="tag good">●</span> : <span className="tag muted">—</span>}</td>
                  </tr>
                ))}
                {rules.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ink-dim)", padding: 20 }}>还没有规则。点下面按钮插入默认 3 条。</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <form action="/api/alerts/bootstrap" method="post" style={{ marginTop: 12 }}>
            <button className="btn ghost sm" type="submit">插入 3 条默认规则</button>
            <span style={{ color: "var(--ink-dim)", fontSize: 12, marginLeft: 8 }}>
              死账号 ≥ 5 · 预警 ≥ 10 · 完播率 &lt; 0.20
            </span>
          </form>

          <div style={{ marginTop: 12 }}>
            <form action="/api/alerts/tick" method="post">
              <button className="btn sm" type="submit">立即评估</button>
              <span style={{ color: "var(--ink-dim)", fontSize: 12, marginLeft: 8 }}>
                通常每分钟 cron 自动跑一次。
              </span>
            </form>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 16 }}>告警事件 ({openAlerts.length} 待处理 / {recentAlerts.length} 最近)</h2>
          <div className="card" style={{ padding: 0, overflow: "auto", maxHeight: "70vh", marginTop: 8 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>fired_at</th>
                  <th>severity</th>
                  <th>rule</th>
                  <th>message</th>
                  <th>resolved</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((a) => (
                  <tr key={a.id}>
                    <td style={{ color: "var(--ink-dim)" }}>{new Date(a.firedAt).toLocaleString("zh-CN", { hour12: false })}</td>
                    <td><span className={a.severity === "bad" ? "tag bad" : a.severity === "warn" ? "tag warn" : "tag muted"}>{a.severity}</span></td>
                    <td className="mono" style={{ fontSize: 11 }}>{a.ruleId}</td>
                    <td style={{ color: "var(--ink)" }}>{a.message}</td>
                    <td>{a.resolved ? <span className="tag muted">✓</span> : <span className="tag bad">●</span>}</td>
                  </tr>
                ))}
                {recentAlerts.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--ink-dim)", padding: 20 }}>暂无告警</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}