import type {
  ArchetypeId,
  ChangeSuggestion,
  ConflictHit,
  DebugScenario,
  EvalResult,
  InfluentialChoice,
  RankedArchetype,
  Transformation,
  WhyChoice,
} from "@/lib/types";
import { OPTION_INDEX, QUESTIONS } from "@/lib/data/questions";
import { ARCHETYPES, ARCHETYPE_INDEX } from "@/lib/data/archetypes";
import { CONFLICTS } from "@/lib/data/conflicts";
import { BASE_SCENARIOS, CONDITIONAL_SCENARIOS } from "@/lib/data/scenarios";

const ALL_ARCHETYPE_IDS = ARCHETYPES.map((a) => a.id);

/** Keep only selections that reference real questions/options. Pure, no mutation. */
export function sanitizeSelections(input: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!input || typeof input !== "object") return out;
  const obj = input as Record<string, unknown>;
  for (const q of QUESTIONS) {
    const v = obj[q.id];
    if (typeof v === "string" && OPTION_INDEX[v] && OPTION_INDEX[v].questionId === q.id) {
      out[q.id] = v;
    }
  }
  return out;
}

function selectedOptionIds(selections: Record<string, string>): string[] {
  return Object.values(selections);
}

function selectedTags(selections: Record<string, string>): Set<string> {
  const tags = new Set<string>();
  for (const id of selectedOptionIds(selections)) {
    const entry = OPTION_INDEX[id];
    for (const t of entry?.option.tags ?? []) tags.add(t);
  }
  return tags;
}

// ── Scoring / inference ───────────────────────────────────────────────────────

function scoreArchetypes(selections: Record<string, string>): Record<ArchetypeId, number> {
  const scores = Object.fromEntries(ALL_ARCHETYPE_IDS.map((id) => [id, 0])) as Record<
    ArchetypeId,
    number
  >;
  for (const optId of selectedOptionIds(selections)) {
    const opt = OPTION_INDEX[optId]?.option;
    if (!opt) continue;
    for (const [arch, pts] of Object.entries(opt.scores)) {
      scores[arch as ArchetypeId] += pts ?? 0;
    }
  }
  return scores;
}

function rank(scores: Record<ArchetypeId, number>): RankedArchetype[] {
  // Confidence = a positive score's share of all positive score mass.
  const positiveTotal = ALL_ARCHETYPE_IDS.reduce((sum, id) => sum + Math.max(0, scores[id]), 0);
  const ranked = ALL_ARCHETYPE_IDS.map((id) => {
    const score = scores[id];
    const percent = positiveTotal > 0 ? Math.round((Math.max(0, score) / positiveTotal) * 100) : 0;
    return { id, name: ARCHETYPE_INDEX[id].name, score, percent };
  });
  // Stable, deterministic ordering: score desc, then fixed archetype order.
  ranked.sort((a, b) => b.score - a.score || ALL_ARCHETYPE_IDS.indexOf(a.id) - ALL_ARCHETYPE_IDS.indexOf(b.id));
  return ranked;
}

function influentialFor(
  topId: ArchetypeId,
  selections: Record<string, string>,
): InfluentialChoice[] {
  const items: InfluentialChoice[] = [];
  for (const [questionId, optId] of Object.entries(selections)) {
    const entry = OPTION_INDEX[optId];
    if (!entry) continue;
    const contribution = entry.option.scores[topId] ?? 0;
    if (contribution > 0) {
      items.push({
        questionId,
        category: entry.category,
        label: entry.option.label,
        explanation: entry.option.explanation,
        contribution,
      });
    }
  }
  items.sort((a, b) => b.contribution - a.contribution);
  return items.slice(0, 5);
}

function whyChoicesFor(selections: Record<string, string>): WhyChoice[] {
  const items: WhyChoice[] = [];
  // Preserve question order for a stable, readable list.
  for (const q of QUESTIONS) {
    const optId = selections[q.id];
    if (!optId) continue;
    const entry = OPTION_INDEX[optId];
    if (!entry) continue;
    items.push({
      questionId: q.id,
      category: entry.category,
      label: entry.option.label,
      explanation: entry.option.explanation,
      caveat: entry.option.caveat,
    });
  }
  return items;
}

// ── Conflicts ─────────────────────────────────────────────────────────────────

function detectConflicts(selections: Record<string, string>): ConflictHit[] {
  const ids = new Set(selectedOptionIds(selections));
  const tags = selectedTags(selections);
  const hits: ConflictHit[] = [];
  for (const rule of CONFLICTS) {
    if (rule.ifAll && !rule.ifAll.every((id) => ids.has(id))) continue;
    if (rule.ifAllTags && !rule.ifAllTags.every((t) => tags.has(t))) continue;
    if (rule.ifNone && rule.ifNone.some((id) => ids.has(id))) continue;
    if (rule.ifNoneTags && rule.ifNoneTags.some((t) => tags.has(t))) continue;
    hits.push({ id: rule.id, severity: rule.severity, message: rule.message, fixes: rule.fixes });
  }
  const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  hits.sort((a, b) => order[a.severity] - order[b.severity]);
  return hits;
}

// ── Debugging scenarios ───────────────────────────────────────────────────────

function selectScenarios(
  topId: ArchetypeId,
  selections: Record<string, string>,
): DebugScenario[] {
  const ids = new Set(selectedOptionIds(selections));
  const tags = selectedTags(selections);

  const triggered = CONDITIONAL_SCENARIOS.filter((s) => {
    const byTag = s.triggerTags?.some((t) => tags.has(t)) ?? false;
    const byOpt = s.triggerOptions?.some((o) => ids.has(o)) ?? false;
    return byTag || byOpt;
  }).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const base = BASE_SCENARIOS.filter((s) => s.archetype === topId);

  // Triggered (architecture-specific) first, then archetype defaults; dedup; cap at 5.
  const seen = new Set<string>();
  const out: DebugScenario[] = [];
  for (const s of [...triggered, ...base]) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
    if (out.length >= 5) break;
  }
  return out;
}

// ── Transformations ───────────────────────────────────────────────────────────

function transformationsFrom(
  topId: ArchetypeId,
  selections: Record<string, string>,
): Transformation[] {
  const out: Transformation[] = [];
  for (const target of ARCHETYPES) {
    if (target.id === topId) continue;
    const changes: ChangeSuggestion[] = [];
    for (const q of QUESTIONS) {
      const current = selections[q.id];
      const ideal = target.ideal[q.id];
      if (!ideal || current === ideal) continue;
      const fromEntry = current ? OPTION_INDEX[current] : undefined;
      const toEntry = OPTION_INDEX[ideal];
      if (!toEntry) continue;
      changes.push({
        questionId: q.id,
        category: q.category,
        from: fromEntry ? fromEntry.option.label : "—",
        to: toEntry.option.label,
        reason: toEntry.option.explanation,
      });
    }
    out.push({
      to: target.id,
      name: target.name,
      changeCount: changes.length,
      changes,
      examples: target.examples,
    });
  }
  // Closest transformations (fewest changes) first.
  out.sort((a, b) => a.changeCount - b.changeCount);
  return out;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function evaluate(rawSelections: unknown): EvalResult {
  const selections = sanitizeSelections(rawSelections);
  const scores = scoreArchetypes(selections);
  const ranked = rank(scores);
  const top = ranked[0];
  const topArch = ARCHETYPE_INDEX[top.id];

  const conflicts = detectConflicts(selections);
  const hasCritical = conflicts.some((c) => c.severity === "critical");
  const highCount = conflicts.filter((c) => c.severity === "high").length;

  // "Coherent" = a clear winner emerged and no severe contradictions.
  const answered = Object.keys(selections).length;
  const clearWinner = top.score > 0 && (ranked.length < 2 || top.score - ranked[1].score >= 2);
  const coherent = answered >= QUESTIONS.length && clearWinner && !hasCritical && highCount === 0;

  let coherenceNote: string;
  if (answered < QUESTIONS.length) {
    coherenceNote = "Some questions are unanswered, so this is a partial read.";
  } else if (!clearWinner && top.score <= 0) {
    coherenceNote =
      "These choices don't map cleanly onto a common production application pattern — they pull in conflicting directions. Treat the match below as a loose guess and review the conflicts.";
  } else if (!clearWinner) {
    coherenceNote =
      "Your choices sit between a few archetypes — the top match is only slightly ahead. The transformations below show how to commit to one shape.";
  } else if (hasCritical || highCount > 0) {
    coherenceNote =
      "The choices point clearly at one application type, but there are serious conflicts to resolve before this architecture would work in production.";
  } else {
    coherenceNote = "These choices form a coherent, recognizable architecture.";
  }

  return {
    selections,
    ranked,
    top: {
      id: topArch.id,
      name: topArch.name,
      description: topArch.description,
      examples: topArch.examples,
      percent: top.percent,
    },
    coherent,
    coherenceNote,
    influential: influentialFor(top.id, selections),
    whyChoices: whyChoicesFor(selections),
    conflicts,
    scenarios: selectScenarios(top.id, selections),
    transformations: transformationsFrom(top.id, selections),
  };
}
