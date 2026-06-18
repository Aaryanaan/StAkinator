"use client";

import { useMemo, useState } from "react";
import { QUESTIONS } from "@/lib/data/questions";
import type { EvalResult } from "@/lib/types";
import ResultView from "@/components/ResultView";
import ArchitectureGallery from "@/components/ArchitectureGallery";

type Phase = "intro" | "gallery" | "quiz" | "loading" | "result" | "error";

interface ApiResponse {
  result: EvalResult;
  narrative: string;
  narrativeSource: "llm" | "template";
}

export default function Wizard() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [data, setData] = useState<ApiResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  const total = QUESTIONS.length;
  const answeredCount = Object.keys(selections).length;
  const current = QUESTIONS[step];

  const progress = useMemo(
    () => Math.round((answeredCount / total) * 100),
    [answeredCount, total],
  );

  function goStep(i: number) {
    setStep(Math.max(0, Math.min(total - 1, i)));
    setHelpOpen(false);
  }

  function choose(optionId: string) {
    const next = { ...selections, [current.id]: optionId };
    setSelections(next);
    // Auto-advance, but never past the last question.
    if (step < total - 1) {
      goStep(step + 1);
    }
  }

  function loadPreset(presetSelections: Record<string, string>) {
    setSelections(presetSelections);
    setStep(0);
    setHelpOpen(false);
    setPhase("quiz");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(finalSelections: Record<string, string>) {
    setPhase("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selections: finalSelections }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = (await res.json()) as ApiResponse;
      setData(json);
      setPhase("result");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("error");
    }
  }

  function restart() {
    setPhase("intro");
    setStep(0);
    setSelections({});
    setData(null);
    setErrorMsg("");
    setHelpOpen(false);
  }

  if (phase === "result" && data) {
    return <ResultView data={data} onRestart={restart} />;
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Header />

      {phase === "intro" && (
        <Intro onStart={() => setPhase("quiz")} onBrowse={() => setPhase("gallery")} />
      )}

      {phase === "gallery" && (
        <ArchitectureGallery onLoad={loadPreset} onReveal={submit} onBack={() => setPhase("intro")} />
      )}

      {phase === "loading" && (
        <div className="mt-16 flex flex-col items-center gap-4 text-slate-300">
          <Spinner />
          <p>Inferring your architecture…</p>
        </div>
      )}

      {phase === "error" && (
        <div className="mt-16 rounded-xl border border-danger/40 bg-danger/10 p-6 text-center">
          <p className="mb-4 text-danger">Couldn&apos;t evaluate: {errorMsg}</p>
          <button
            onClick={() => submit(selections)}
            className="rounded-lg border border-edge bg-panel px-4 py-2 hover:border-brand"
          >
            Retry
          </button>
        </div>
      )}

      {phase === "quiz" && (
        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_260px]">
          <section>
            <ProgressBar step={step} total={total} percent={progress} category={current.category} />

            <div key={current.id} className="animate-rise mt-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-white">{current.prompt}</h2>
                <button
                  onClick={() => setHelpOpen((v) => !v)}
                  aria-label="How this choice affects your architecture"
                  aria-expanded={helpOpen}
                  title="How does this choice fit?"
                  className={[
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition",
                    helpOpen
                      ? "border-brand bg-brand/15 text-brand"
                      : "border-edge text-slate-400 hover:border-brand hover:text-brand",
                  ].join(" ")}
                >
                  ?
                </button>
              </div>

              {helpOpen && <HelpCallout help={current.help} />}

              <div className="mt-5 grid gap-3">
                {current.options.map((opt) => {
                  const active = selections[current.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => choose(opt.id)}
                      className={[
                        "group rounded-xl border p-4 text-left transition",
                        active
                          ? "border-brand bg-brand/10"
                          : "border-edge bg-panel hover:border-brand/60 hover:bg-panel/80",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{opt.label}</span>
                        {active && <span className="text-brand">✓</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{opt.explanation}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => goStep(step - 1)}
                disabled={step === 0}
                className="rounded-lg border border-edge px-4 py-2 text-sm text-slate-300 enabled:hover:border-brand disabled:opacity-30"
              >
                ← Back
              </button>

              {step < total - 1 ? (
                <button
                  onClick={() => goStep(step + 1)}
                  disabled={!selections[current.id]}
                  className="rounded-lg border border-edge px-4 py-2 text-sm text-slate-300 enabled:hover:border-brand disabled:opacity-30"
                >
                  Skip / Next →
                </button>
              ) : (
                <button
                  onClick={() => submit(selections)}
                  disabled={answeredCount < total}
                  className="rounded-lg border border-accent bg-accent/15 px-5 py-2 text-sm font-semibold text-accent enabled:hover:bg-accent/25 disabled:opacity-40"
                >
                  Reveal architecture →
                </button>
              )}
            </div>

            {answeredCount < total && step === total - 1 && (
              <p className="mt-2 text-right text-xs text-warn">
                Answer all {total} questions to reveal ({answeredCount}/{total} done).
              </p>
            )}
          </section>

          <SummaryPanel selections={selections} step={step} onJump={(i) => goStep(i)} />
        </div>
      )}
    </main>
  );
}

function Header() {
  return (
    <header className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2 text-sm text-brand">
        <span className="inline-block h-2 w-2 rounded-full bg-accent" />
        Architecture Akinator
      </div>
      <h1 className="text-2xl font-bold text-white sm:text-3xl">
        Make the choices. We&apos;ll name the system.
      </h1>
    </header>
  );
}

function Intro({ onStart, onBrowse }: { onStart: () => void; onBrowse: () => void }) {
  return (
    <section className="mt-8 animate-rise rounded-2xl border border-edge bg-panel/60 p-7">
      <p className="text-slate-300">
        Answer {QUESTIONS.length} questions about how you&apos;d build a client→backend system —
        databases, consistency, server state, caching, deployment, and more. Each choice is a puzzle
        piece; tap the <span className="font-bold text-brand">?</span> on any question to see how it
        fits with the others. Then this tool:
      </p>
      <ul className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
        {[
          "Infers what kind of real-world app your choices describe",
          "Shows famous systems built the same way",
          "Explains why each choice fits — and where it bites",
          "Flags combinations that don't actually work",
          "Generates 5 realistic production failures to debug",
          "Tells you how to morph it into a different kind of app",
        ].map((t) => (
          <li key={t} className="flex gap-2">
            <span className="text-accent">▹</span>
            {t}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-slate-500">
        The inference is done by a rules + scoring engine (not a black-box LLM), so the verdicts are
        consistent and explainable. An optional API key only polishes the written summary.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onStart}
          className="rounded-lg border border-brand bg-brand/15 px-6 py-3 font-semibold text-brand transition hover:bg-brand/25"
        >
          Start from scratch →
        </button>
        <button
          onClick={onBrowse}
          className="rounded-lg border border-edge px-6 py-3 font-semibold text-slate-200 transition hover:border-accent hover:text-accent"
        >
          Explore common architectures
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        New to this? Start with a common architecture (Slack, Shopify, Netflix…) to see a known-good
        setup, then load it and experiment.
      </p>
    </section>
  );
}

function HelpCallout({ help }: { help: string }) {
  const [main, works] = help.split(/Works with:\s*/);
  return (
    <div className="animate-rise mt-3 rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm text-slate-300">
      <p>{main.trim()}</p>
      {works && (
        <p className="mt-2 text-xs text-brand">
          <span className="font-semibold">Puzzle-fits with: </span>
          {works.trim().replace(/\.$/, "")}
        </p>
      )}
    </div>
  );
}

function ProgressBar({
  step,
  total,
  percent,
  category,
}: {
  step: number;
  total: number;
  percent: number;
  category: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Question {step + 1} / {total} · <span className="text-brand">{category}</span>
        </span>
        <span>{percent}% answered</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-edge">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
          style={{ width: `${Math.max(6, percent)}%` }}
        />
      </div>
    </div>
  );
}

function SummaryPanel({
  selections,
  step,
  onJump,
}: {
  selections: Record<string, string>;
  step: number;
  onJump: (i: number) => void;
}) {
  return (
    <aside className="scroll-slim h-fit max-h-[70vh] overflow-auto rounded-xl border border-edge bg-panel/40 p-4">
      <h3 className="text-sm font-semibold text-slate-200">Your build</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {QUESTIONS.map((q, i) => {
          const optId = selections[q.id];
          const opt = q.options.find((o) => o.id === optId);
          const isCurrent = i === step;
          return (
            <li key={q.id}>
              <button
                onClick={() => onJump(i)}
                className={[
                  "w-full rounded-lg px-2 py-1.5 text-left transition",
                  isCurrent ? "bg-brand/10" : "hover:bg-edge/50",
                ].join(" ")}
              >
                <span className="block text-[11px] uppercase tracking-wide text-slate-500">
                  {q.category}
                </span>
                <span className={opt ? "text-slate-200" : "text-slate-600"}>
                  {opt ? opt.label : "— not chosen"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-edge border-t-brand" />
  );
}
