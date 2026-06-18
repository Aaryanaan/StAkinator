import { QUESTIONS, OPTION_INDEX } from "@/lib/data/questions";
import { ARCHETYPES } from "@/lib/data/archetypes";
import type { ArchetypeId } from "@/lib/types";

export interface PresetStep {
  questionId: string;
  category: string;
  prompt: string;
  optionId: string;
  label: string;
  /** Why this piece is in this architecture (its impact on the app). */
  explanation: string;
  /** The trade-off this piece brings. */
  caveat?: string;
}

export interface Preset {
  id: ArchetypeId;
  name: string;
  description: string;
  examples: string[];
  /** Ordered, one per question — the full 11-choice "completed puzzle". */
  steps: PresetStep[];
  /** Ready to drop straight into the builder. */
  selections: Record<string, string>;
}

/** Build a worked-example architecture from an archetype's ideal choices. */
export function buildPreset(id: ArchetypeId): Preset | null {
  const arch = ARCHETYPES.find((a) => a.id === id);
  if (!arch) return null;

  const steps: PresetStep[] = [];
  const selections: Record<string, string> = {};

  // Walk questions in order so the preset reads top-to-bottom like the builder.
  for (const q of QUESTIONS) {
    const optionId = arch.ideal[q.id];
    const entry = optionId ? OPTION_INDEX[optionId] : undefined;
    if (!optionId || !entry) continue;
    selections[q.id] = optionId;
    steps.push({
      questionId: q.id,
      category: q.category,
      prompt: q.prompt,
      optionId,
      label: entry.option.label,
      explanation: entry.option.explanation,
      caveat: entry.option.caveat,
    });
  }

  return {
    id: arch.id,
    name: arch.name,
    description: arch.description,
    examples: arch.examples,
    steps,
    selections,
  };
}

export const PRESETS: Preset[] = ARCHETYPES.map((a) => buildPreset(a.id)).filter(
  (p): p is Preset => p !== null,
);
