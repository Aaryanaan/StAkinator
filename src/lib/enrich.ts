import type { EvalResult } from "@/lib/types";

// Build a readable narrative from the structured result WITHOUT any LLM.
// This is the default the app ships with — always available, fully offline.
export function templateNarrative(result: EvalResult): string {
  const lines: string[] = [];
  const verb = result.coherent ? "looks most like" : "most resembles";
  lines.push(`Based on your choices, this architecture ${verb} a **${result.top.name}**.`);
  lines.push(result.top.description);

  if (result.similarity) {
    const names = result.similarity.related.map((r) => r.name).join(" and ");
    lines.push(
      `It's a close relative of ${names} — sibling architectures that share many of the same building blocks — so the same setup naturally resembles several at once.`,
    );
  }

  lines.push(result.coherenceNote);

  if (result.influential.length) {
    const drivers = result.influential.map((i) => i.label).join(", ");
    lines.push(`The choices pulling hardest toward this type: ${drivers}.`);
  }

  if (result.conflicts.length) {
    const worst = result.conflicts[0];
    lines.push(
      `Heads up — the biggest issue to resolve is a ${worst.severity} conflict: ${worst.message}`,
    );
  } else {
    lines.push("No conflicts were detected between your choices — the pieces fit together.");
  }

  lines.push(
    `Real systems shaped like this include ${result.top.examples.join(", ")}. Scroll on for why each choice matters, five failures this design tends to hit, and how to morph it into a different kind of app.`,
  );

  return lines.join("\n\n");
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

// Optionally rewrite the narrative with Claude when ANTHROPIC_API_KEY is set.
// Falls back to the template on any error so the app never breaks.
export async function enrichNarrative(result: EvalResult): Promise<{ narrative: string; source: "llm" | "template" }> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return { narrative: templateNarrative(result), source: "template" };
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;

  // Compact, factual summary — the model only rewrites facts the engine produced.
  const facts = {
    inferredType: result.top.name,
    confidencePercent: result.top.percent,
    coherent: result.coherent,
    coherenceNote: result.coherenceNote,
    topRivals: result.ranked.slice(1, 3).map((r) => `${r.name} (${r.percent}%)`),
    drivingChoices: result.influential.map((i) => `${i.label}: ${i.explanation}`),
    conflicts: result.conflicts.map((c) => `[${c.severity}] ${c.message}`),
    realExamples: result.top.examples,
  };

  const prompt =
    "You are a friendly senior systems-design tutor. Using ONLY the facts in the JSON below, " +
    "write a tight 2–3 paragraph narrative (no headings, no lists) that tells the user what kind of " +
    "application their architecture choices describe, why those choices point there, and the single most " +
    "important thing to fix if there are conflicts. Do not invent technologies or examples that aren't in the JSON. " +
    "Be concrete and encouraging.\n\nFACTS:\n" +
    JSON.stringify(facts, null, 2);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { narrative: templateNarrative(result), source: "template" };
    }
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content
      ?.filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string)
      .join("\n")
      .trim();
    if (!text) {
      return { narrative: templateNarrative(result), source: "template" };
    }
    return { narrative: text, source: "llm" };
  } catch {
    return { narrative: templateNarrative(result), source: "template" };
  }
}
