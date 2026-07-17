"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface SourceRowData {
  id: string;
  displayName: string;
  kind: string;
  enabled: boolean;
  cronExpr: string;
  config: Record<string, unknown>;
  lastStatus: string | null;
  lastError: string | null;
}

interface RunResult {
  ok: boolean;
  rows?: number;
  error?: string;
  by?: string;
}

export function SourceRow({ source }: { source: SourceRowData }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "run" | "fixture">(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const router = useRouter();

  async function save(form: FormData) {
    setBusy("save");
    const r = await fetch("/api/sources/" + source.id, { method: "PATCH", body: form });
    setBusy(null);
    if (r.ok) { setOpen(false); router.refresh(); }
    else alert(await r.text());
  }

  async function runNow() {
    setBusy("run");
    setResult(null);
    try {
      const r = await fetch("/api/ingest/" + source.id, { method: "POST" });
      const j = (await r.json()) as RunResult;
      setResult(j);
      router.refresh();
    } catch (e: unknown) {
      setResult({ ok: false, error: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  }

  async function dropFixture() {
    setBusy("fixture");
    try {
      const r = await fetch("/api/ingest/" + source.id + "/fixture", { method: "POST" });
      const j = (await r.json()) as { ok: boolean; file?: string; error?: string };
      if (!j.ok) { setResult({ ok: false, error: j.error ?? "投放失败" }); return; }
      // Auto-trigger run immediately after fixture drop
      await runNow();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <tr>
        <td className="mono">{source.id}</td>
        <td>{source.displayName}</td>
        <td><span className="tag muted">{source.kind}</span></td>
        <td>{source.enabled ? <span className="tag good">●</span> : <span className="tag muted">—</span>}</td>
        <td className="mono" style={{ color: "var(--ink-dim)", fontSize: 12 }}>{source.cronExpr || "—"}</td>
        <td style={{ color: "var(--ink-dim)", fontSize: 12, maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {JSON.stringify(source.config)}
        </td>
        <td>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn sm ghost" onClick={runNow} disabled={busy !== null || !source.enabled}>
              {busy === "run" ? "抓取中…" : "立即执行"}
            </button>
            {source.kind === "feigua" ? (
              <button className="btn sm ghost" onClick={dropFixture} disabled={busy !== null || !source.enabled}
                      title="在 inbox/feigua/ 写一份示例 JSON 然后立即执行 (用于演示)">
                {busy === "fixture" ? "投放中…" : "投放示例"}
              </button>
            ) : null}
            <button className="btn sm ghost" onClick={() => setOpen((o) => !o)}>{open ? "取消" : "编辑"}</button>
            {result ? (
              result.ok
                ? <span className="tag good" title={`by ${result.by ?? "?"}`}>+{result.rows ?? 0}</span>
                : <span className="tag bad" title={result.error}>err</span>
            ) : null}
          </div>
        </td>
      </tr>

      {result && !result.ok ? (
        <tr>
          <td colSpan={7} style={{ background: "rgba(255,93,108,0.08)", color: "var(--bad)", fontSize: 12, fontFamily: "monospace" }}>
            error: {result.error}
          </td>
        </tr>
      ) : null}

      {open ? (
        <tr>
          <td colSpan={7} style={{ background: "var(--bg-1)" }}>
            <form onSubmit={(e) => { e.preventDefault(); save(new FormData(e.currentTarget)); }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr", gap: 12, padding: 12 }}>
              <label>启用 <select name="enabled" defaultValue={String(source.enabled)} className="input"><option value="true">true</option><option value="false">false</option></select></label>
              <label>Cron <input name="cronExpr" className="input" defaultValue={source.cronExpr} /></label>
              <label>Config (JSON) <textarea name="config" className="input mono" rows={2} defaultValue={JSON.stringify(source.config, null, 2)} /></label>
              <label>Name <input name="displayName" className="input" defaultValue={source.displayName} /></label>
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
                <button className="btn" disabled={busy === "save"}>{busy === "save" ? "保存中…" : "保存"}</button>
              </div>
            </form>
          </td>
        </tr>
      ) : null}
    </>
  );
}