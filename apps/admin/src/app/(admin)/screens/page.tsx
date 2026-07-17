import { Shell } from "@/components/Shell";

/**
 * /screens — 大屏预览。Superset 上的 "data-tw 大屏" dashboard 装 6 个 chart。
 * 这里 iframe 直接嵌整个 dashboard，旧 Next.js dashboard (port 3003) 只作为
 * TV 屏的 fallback —— 因为 Superset 上的图不一定每个都 16:9 适屏。
 *
 * 同一个 dashboard 既给后台看也能给 TV 看 (单独端口的不同 URL)。
 */

const SUPERSET_DASHBOARD_SLUG = process.env.NEXT_PUBLIC_SUPERSET_DASHBOARD_SLUG ?? "data-tw-screens";

export default function Page() {
  const base = process.env.NEXT_PUBLIC_SUPERSET_BASE ?? "http://localhost:8088";
  // Superset 4.x embed url (standalone):
  const dashboardUrl = `${base}/superset/dashboard/${SUPERSET_DASHBOARD_SLUG}/`;
  const tvFallback = process.env.NEXT_PUBLIC_DASHBOARD_BASE ?? "http://localhost:3003";

  return (
    <Shell>
      <h1 style={{ marginTop: 0, fontSize: 24 }}>数据大屏预览</h1>
      <p style={{ color: "var(--ink-dim)", fontSize: 13 }}>
        嵌的是 Superset <code className="mono">{dashboardUrl}</code>。TV 机器直接连 Superset 也行 (推荐)，
        或连老 dashboard <code className="mono">{tvFallback}</code> 作 fallback。
      </p>

      <div className="card" style={{ padding: 8, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, padding: "0 4px" }}>
          <strong>Superset · data-tw 大屏</strong>
          <a className="mono" href={dashboardUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 12 }}>
            在 Superset 打开 ↗
          </a>
        </div>
        <iframe src={dashboardUrl} style={{ width: "100%", height: "78vh", border: 0, borderRadius: 8, background: "#0a0f1c" }} />
      </div>

      <div className="card">
        <strong>fallback · 老 dashboard</strong>
        <p style={{ color: "var(--ink-dim)", fontSize: 12, marginTop: 6 }}>
          接下来 6 屏 (高层/运营/内容/全量/趋势/地域) 是老 Next.js dashboard 的地址。Superset 接管前保持原样作 fallback。
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 12 }}>
          {[
            ["自动轮播首页", "/"],
            ["高层决策屏",   "/screen/exec"],
            ["运营作战屏",   "/screen/ops"],
            ["内容生产屏",   "/screen/content"],
            ["全量账号屏",   "/screen/full"],
            ["部门趋势屏",   "/screen/trend"],
            ["地域分布屏",   "/screen/geo"],
          ].map(([label, path]) => (
            <div key={path} className="card" style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <strong>{label}</strong>
                <a className="mono" href={tvFallback + path} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 12 }}>
                  打开 ↗
                </a>
              </div>
              <iframe src={tvFallback + path} style={{ width: "100%", height: 280, border: 0, borderRadius: 8, background: "#000" }} />
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}