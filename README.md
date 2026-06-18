# Architecture Akinator

An interactive system-design game. You make a series of full-stack architecture choices
(database type, consistency model, server state, API style, caching, deployment, …) and the
app figures out **what kind of real-world application you've just described** — then teaches
you why.

It does five things with your choices:

1. **Infers the application archetype** (e.g. _Real-Time Chat_, _E-commerce_, _Analytics_) from
   the choices — never asking "what are you building?" directly.
2. **Names famous systems** built the same way (Slack, Shopify, Netflix, Uber, …).
3. **Explains why each choice fits** — and the caveat where it bites you.
4. **Detects conflicts** — combinations that don't actually work in production, with fixes.
5. **Generates 5 realistic production failures** to debug, and shows **how to transform** the
   architecture into a different kind of app.

## The important design decision

**The rules decide; the LLM only explains.** Inference, conflict detection, examples,
debugging scenarios, and transformations are all produced by a deterministic
**scoring + rule engine** (`src/lib/engine.ts`) over a curated knowledge base
(`src/lib/data/`). This means verdicts are consistent, explainable, and can't hallucinate.

An LLM (Claude) is **optional** and only rewrites the final summary into nicer prose. **The app
is fully functional with no API key** — it ships with a built-in template narrative.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

That's it. No database, no external services, no keys required.

For a production build:

```bash
npm run build
npm run start
```

## Optional: enable the Claude-enriched narrative

The only thing a key changes is the written 2–3 paragraph summary at the top of the results
page (it gets rewritten by Claude instead of using the built-in template). Everything else is
identical.

```bash
cp .env.example .env.local
# then paste your key into .env.local:
# ANTHROPIC_API_KEY=sk-ant-...
```

Restart the dev/prod server. If the key is missing, invalid, or the call fails, the app
silently falls back to the template — it never breaks.

## How it works

```
your choices
   ↓  scoreArchetypes()      each option contributes weighted points to each archetype
   ↓  rank()                 highest score wins; confidence = share of positive score mass
   ↓  detectConflicts()      tag/option rules flag combinations that don't work
   ↓  selectScenarios()      5 debugging scenarios, prioritising ones matching your choices
   ↓  transformationsFrom()  diff your choices vs every other archetype's ideal
   ↓  enrichNarrative()      template prose, or Claude if a key is set
results page
```

### Knowledge base (`src/lib/data/`)

| File | What it holds |
|---|---|
| `questions.ts` | 11 questions, each option with an `explanation`, `caveat`, per-archetype `scores`, and capability `tags` |
| `archetypes.ts` | 9 archetypes, each with real examples and an `ideal` choice per question (used for transformations) |
| `conflicts.ts` | Rules that fire on selected option-ids / tags to flag incoherent combinations |
| `scenarios.ts` | 5 base debugging scenarios per archetype + conditional ones triggered by your actual choices |

### Want to extend it?

- **Add an archetype:** add it to `archetypes.ts` (with an `ideal` for every question), give it
  `scores` across the options in `questions.ts`, and add 5 base scenarios in `scenarios.ts`.
- **Add a question/choice:** add it to `questions.ts` (option ids must be globally unique — the
  module throws at load if not) and score it across archetypes.
- **Add a conflict:** add a rule to `conflicts.ts` using `ifAll`/`ifAllTags`/`ifNone`/`ifNoneTags`.

A self-consistency invariant worth preserving: **each archetype's `ideal` selection set should
infer that archetype, be coherent, and have zero conflicts.** A quick way to check is to POST
each ideal to `/api/evaluate` and assert the top match + `coherent: true`.

## Tech

Next.js 14 (App Router) · TypeScript · Tailwind CSS. Single deployable app; the engine runs in
a Node API route (`src/app/api/evaluate/route.ts`).

## A note on dependencies

This project pins `next@14.2.35` (the latest patched 14.x). `npm audit` still reports two
advisories that live inside Next's own bundled tooling (a build-time PostCSS issue and a
`next/image` disk-cache advisory); clearing them requires a major upgrade to Next 16. Neither is
runtime-exploitable for this app, so the pin stays on 14.x for stability.
