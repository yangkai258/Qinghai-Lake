import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { getSession } from "@/lib/auth";
import { t } from "@/i18n/zh";

const NAV = [
  { href: "/",         labelKey: "nav.overview" },
  { href: "/sources",  labelKey: "nav.sources" },
  { href: "/snapshots",labelKey: "nav.snapshots" },
  { href: "/runs",     labelKey: "nav.runs" },
  { href: "/screens",  labelKey: "nav.screens" },
  { href: "/superset", labelKey: "nav.superset" },
  { href: "/alerts",   labelKey: "nav.alerts" },
  { href: "/settings", labelKey: "nav.settings" },
];

export async function Shell({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-0)" }}>
      <aside style={{ width: 220, padding: 18, borderRight: "1px solid var(--border)", background: "var(--bg-1)" }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>data-tw</div>
        <div style={{ color: "var(--ink-dim)", fontSize: 12, marginBottom: 28 }}>数据中台 · 管理后台</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} style={{ padding: "8px 12px", borderRadius: 8, color: "var(--ink)", textDecoration: "none", fontSize: 14 }}>
              {t(n.labelKey)}
            </Link>
          ))}
        </nav>
        <div style={{ position: "absolute", bottom: 18, left: 18, right: 18, fontSize: 12, color: "var(--ink-dim)" }}>
          <div style={{ marginBottom: 8 }}>登录身份</div>
          <div className="mono" style={{ color: "var(--ink)" }}>{s?.email}</div>
          <div className="tag muted" style={{ marginTop: 4 }}>{s?.role}</div>
          <LogoutButton />
        </div>
      </aside>
      <main style={{ flex: 1, padding: 28 }}>{children}</main>
    </div>
  );
}
