"use client";

import { useState } from "react";
import { PRESETS, buildPreset, type Preset } from "@/lib/presets";

export default function ArchitectureGallery({
  onLoad,
  onReveal,
  onBack,
}: {
  /** Fill the builder with this architecture's choices so the user can review/tweak. */
  onLoad: (selections: Record<string, string>) => void;
  /** Jump straight to the results for this architecture. */
  onReveal: (selections: Record<string, string>) => void;
  /** Return to the intro screen. */
  onBack: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const preset: Preset | null = selectedId ? buildPreset(selectedId as Preset["id"]) : null;

  if (preset) {
    return <PresetDetail preset={preset} onLoad={onLoad} onReveal={onReveal} onBack={() => setSelectedId(null)} />;
  }

  return (
    <section className="mt-8 animate-rise">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Common architectures</h2>
          <p className="text-sm text-slate-400">
            Worked examples — see how famous apps arrange the same 11 pieces, then load one and tinker.
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-edge px-3 py-1.5 text-sm text-slate-300 hover:border-brand"
        >
          ← Back
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className="group rounded-xl border border-edge bg-panel/60 p-4 text-left transition hover:border-brand/60 hover:bg-panel"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{p.name}</span>
              <span className="text-brand opacity-0 transition group-hover:opacity-100">→</span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-slate-400">{p.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.examples.slice(0, 3).map((ex) => (
                <span key={ex} className="rounded-full border border-edge bg-ink/60 px-2 py-0.5 text-[11px] text-slate-300">
                  {ex}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function PresetDetail({
  preset,
  onLoad,
  onReveal,
  onBack,
}: {
  preset: Preset;
  onLoad: (selections: Record<string, string>) => void;
  onReveal: (selections: Record<string, string>) => void;
  onBack: () => void;
}) {
  const [openStep, setOpenStep] = useState<string | null>(preset.steps[0]?.questionId ?? null);

  return (
    <section className="mt-8 animate-rise">
      <button
        onClick={onBack}
        className="mb-4 rounded-lg border border-edge px-3 py-1.5 text-sm text-slate-300 hover:border-brand"
      >
        ← All architectures
      </button>

      <h2 className="text-2xl font-bold text-white">{preset.name}</h2>
      <p className="mt-2 text-slate-300">{preset.description}</p>

      <div className="mt-4">
        <span className="text-xs uppercase tracking-wide text-slate-500">Real apps built this way</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {preset.examples.map((ex) => (
            <span key={ex} className="rounded-full border border-edge bg-panel px-3 py-1 text-sm text-slate-200">
              {ex}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-200">
          The 11 pieces — tap any to see how it shapes the app
        </h3>
        <ul className="mt-3 space-y-2">
          {preset.steps.map((s) => {
            const open = openStep === s.questionId;
            return (
              <li key={s.questionId} className="overflow-hidden rounded-lg border border-edge bg-panel/50">
                <button
                  onClick={() => setOpenStep(open ? null : s.questionId)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-edge/30"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-[11px] uppercase tracking-wide text-slate-500">
                      {s.category}
                    </span>
                    <span className="font-semibold text-white">{s.label}</span>
                  </span>
                  <span className={`text-brand transition ${open ? "rotate-90" : ""}`}>›</span>
                </button>
                {open && (
                  <div className="border-t border-edge/60 px-3 py-3 pl-[7.75rem]">
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-accent">Why it&apos;s here: </span>
                      {s.explanation}
                    </p>
                    {s.caveat && (
                      <p className="mt-2 text-sm text-warn/90">
                        <span className="font-semibold">Trade-off: </span>
                        {s.caveat}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => onLoad(preset.selections)}
          className="rounded-lg border border-brand bg-brand/15 px-5 py-2.5 font-semibold text-brand transition hover:bg-brand/25"
        >
          Load into builder &amp; tinker →
        </button>
        <button
          onClick={() => onReveal(preset.selections)}
          className="rounded-lg border border-accent bg-accent/15 px-5 py-2.5 font-semibold text-accent transition hover:bg-accent/25"
        >
          Reveal full analysis →
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        &quot;Load into builder&quot; fills all 11 answers so you can change pieces and watch the result shift.
      </p>
    </section>
  );
}
