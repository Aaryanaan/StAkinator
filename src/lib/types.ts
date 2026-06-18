// Core domain types for the Architecture Akinator knowledge base + engine.

export type ArchetypeId =
  | "crud"
  | "ecom"
  | "chat"
  | "social"
  | "market"
  | "analytics"
  | "streaming"
  | "iot"
  | "ai_search";

export type Severity = "critical" | "high" | "medium" | "low";

export interface Option {
  /** Globally unique id across all questions. Referenced by conflicts/ideals. */
  id: string;
  label: string;
  /** Why this choice points toward a type / why it is helpful. */
  explanation: string;
  /** What could go wrong with this choice (the teaching caveat). */
  caveat?: string;
  /** Points contributed toward each archetype. Omit = 0. */
  scores: Partial<Record<ArchetypeId, number>>;
  /** Capability tags used by conflict rules + scenario triggers. */
  tags?: string[];
}

export interface Question {
  /** Stable question/category id, e.g. "db". */
  id: string;
  category: string;
  prompt: string;
  /** Beginner-facing guidance: what this choice affects + which other
   *  questions it locks together (the "puzzle-piece" interactions). */
  help: string;
  options: Option[];
}

export interface Archetype {
  id: ArchetypeId;
  name: string;
  description: string;
  examples: string[];
  /** Recommended option id per question id — used for transformations. */
  ideal: Record<string, string>;
}

export interface ConflictRule {
  id: string;
  severity: Severity;
  /** All of these option ids must be selected. */
  ifAll?: string[];
  /** All of these tags must be present among selected options. */
  ifAllTags?: string[];
  /** None of these option ids may be selected. */
  ifNone?: string[];
  /** None of these tags may be present. */
  ifNoneTags?: string[];
  message: string;
  fixes: string[];
}

export interface DebugScenario {
  id: string;
  archetype: ArchetypeId | "any";
  title: string;
  /** Which stage / choice to investigate. */
  stage: string;
  cause: string;
  fix: string;
  /** Prefer this scenario when any of these tags/options are present. */
  triggerTags?: string[];
  triggerOptions?: string[];
  /** Higher = surfaced first. Base archetype scenarios are 0. */
  priority?: number;
}

// ── Engine output ───────────────────────────────────────────────────────────

export interface RankedArchetype {
  id: ArchetypeId;
  name: string;
  score: number;
  percent: number;
}

export interface InfluentialChoice {
  questionId: string;
  category: string;
  label: string;
  explanation: string;
  contribution: number;
}

export interface WhyChoice {
  questionId: string;
  category: string;
  label: string;
  explanation: string;
  caveat?: string;
}

export interface ConflictHit {
  id: string;
  severity: Severity;
  message: string;
  fixes: string[];
}

export interface ChangeSuggestion {
  questionId: string;
  category: string;
  from: string;
  to: string;
  reason: string;
}

export interface Transformation {
  to: ArchetypeId;
  name: string;
  changeCount: number;
  changes: ChangeSuggestion[];
  examples: string[];
}

/** Affirmative "this resembles X & Y" note — explains overlap, not doubt. */
export interface Similarity {
  related: { id: ArchetypeId; name: string; percent: number }[];
  /** Choices that point at BOTH the top type and its nearest neighbor. */
  shared: string[];
  /** Choices that tip it toward the top type over that nearest neighbor. */
  distinctive: string[];
}

export interface EvalResult {
  selections: Record<string, string>;
  ranked: RankedArchetype[];
  top: {
    id: ArchetypeId;
    name: string;
    description: string;
    examples: string[];
    percent: number;
  };
  coherent: boolean;
  coherenceNote: string;
  influential: InfluentialChoice[];
  whyChoices: WhyChoice[];
  conflicts: ConflictHit[];
  scenarios: DebugScenario[];
  transformations: Transformation[];
  similarity: Similarity | null;
}
