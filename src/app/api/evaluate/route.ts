import { NextResponse } from "next/server";
import { evaluate } from "@/lib/engine";
import { enrichNarrative } from "@/lib/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const selections = (body as { selections?: unknown })?.selections;
  const result = evaluate(selections);
  const { narrative, source } = await enrichNarrative(result);

  return NextResponse.json({ result, narrative, narrativeSource: source });
}
