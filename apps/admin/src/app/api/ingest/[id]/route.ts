import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { runOnce } from "@data-tw/connectors";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let session;
  try { session = await requireSession(); } catch { return new NextResponse("unauthorized", { status: 401 }); }

  const { id } = await ctx.params;

  // Featherweight logger that swallows into a no-op pino shape.
  // (Connectors expect { info/warn/error: (msg, extra?) => void } - pino satisfies this.)
  const log = {
    info: (..._a: unknown[]) => {},
    warn: (..._a: unknown[]) => {},
    error: (..._a: unknown[]) => {},
    debug: (..._a: unknown[]) => {},
    fatal: (..._a: unknown[]) => {},
    trace: (..._a: unknown[]) => {},
    silent: (..._a: unknown[]) => {},
    level: "silent" as const,
  } as unknown as import("pino").Logger;

  try {
    const r = await runOnce(id, log);
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error, rows: 0 }, { status: 200 });
    }
    return NextResponse.json({ ok: true, rows: r.rows, by: session.email });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}