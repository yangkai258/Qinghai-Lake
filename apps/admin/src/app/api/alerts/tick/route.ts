import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { evaluateAlerts } from "@data-tw/connectors";

export async function POST(req: NextRequest) {
  try { await requireSession(); } catch { return new NextResponse("unauthorized", { status: 401 }); }
  const r = await evaluateAlerts();
  return NextResponse.json(r);
}