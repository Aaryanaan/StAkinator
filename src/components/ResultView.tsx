"use client";

import { useState } from "react";
import type { EvalResult, Severity } from "@/lib/types";

interface ApiResponse {
  result: EvalResult;
  narrative: string;
  narrativeSource: "llm" | "template";
}

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: "border-danger/60 bg-danger/10 text-danger",
  high: "border-danger/50 bg-danger/10 text-danger",
  medium: "border-warn/50 bg-warn/10 text-warn",
  low: "border-edge bg-panel/60 text-slate-300",
};

export default function ResultView({
  data,
  onRestart,
}: {
  data: ApiResponse;
  onRestart: () => void;
}) {
  const { result, narrative, narrativeSource } = data;
  const [targetId, setTargetId] = useState(result.transformations[0]?.to ?? "");
  const target = result.transformations.find((t) => t.to === targetId);

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <button
        onClick={onRestart}
        className="mb-6 rounded-lg border border-edge px-3 py-1.5 text-sm text-slate-300 hover:border-brand"
      >
        ← Build another
      </button>

      {/* Verdict */}
      <section className="animate-rise rounded-2xl border border-edge bg-panel/60 p-7">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
          Inferred application type
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[11px]",
              result.coherent ? "bg-accent/15 text-accent" : "bg-warn/15 text-warn",
            ].join(" ")}
          >
            {result.coherent ? "coherent" : "needs review"}
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-white">{result.top.name}</h1>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Match strength</span>
            <span className="text-slate-200">{result.top.percent}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-edge">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-accent"
              style={{ width: `${Math.max(4, result.top.percent)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            How strongly your choices point here versus the other types — not a percent chance.
            {result.ranked[1] && result.ranked[1].percent >= 15 ? (
              <>
                {" "}
                Its nearest cousin is{" "}
                <span className="text-slate-300">{result.ranked[1].name}</span> ({result.ranked[1].percent}%),
                because those architectures share a lot of infrastructure.
              </>
            ) : (
              <> Your choices are quite distinctive to this type.</>
            )}
          </p>
        </div>

        <p className="mt-5 whitespace-pre-line text-slate-300">{narrative}</p>
        <p className="mt-3 text-[11px] text-slate-600">
          Narrative source: {narrativeSource === "llm" ? "Claude (enriched)" : "built-in template"}
        </p>
      </section>

      {/* Ranked matches */}
      <Section title="How the matches ranked">
        <ul className="space-y-2">
          {result.ranked.slice(0, 5).map((r, i) => (
            <li key={r.id} className="flex items-center gap-3">
              <span className="w-5 text-right text-sm text-slate-500">{i + 1}</span>
              <span className="w-52 shrink-0 text-sm text-slate-200">{r.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-edge">
                <div
                  className={i === 0 ? "h-full rounded-full bg-accent" : "h-full rounded-full bg-brand/60"}
                  style={{ width: `${Math.max(2, r.percent)}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs text-slate-400">{r.percent}%</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Examples */}
      <Section title="Real systems shaped like this">
        <div className="flex flex-wrap gap-2">
          {result.top.examples.map((ex) => (
            <span key={ex} className="rounded-full border border-edge bg-panel px-3 py-1 text-sm text-slate-200">
              {ex}
            </span>
          ))}
        </div>
      </Section>

      {/* Most influential choices */}
      {result.influential.length > 0 && (
        <Section title="Choices that pushed it here">
          <ul className="space-y-3">
            {result.influential.map((c) => (
              <li key={c.questionId} className="rounded-lg border border-edge bg-panel/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{c.label}</span>
                  <span className="text-xs text-accent">+{c.contribution} signal</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{c.explanation}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Why each choice */}
      <Section title="Why each choice matters">
        <div className="grid gap-3 sm:grid-cols-2">
          {result.whyChoices.map((c) => (
            <div key={c.questionId} className="rounded-lg border border-edge bg-panel/50 p-3">
              <span className="text-[11px] uppercase tracking-wide text-slate-500">{c.category}</span>
              <p className="font-semibold text-white">{c.label}</p>
              <p className="mt-1 text-sm text-slate-300">{c.explanation}</p>
              {c.caveat && (
                <p className="mt-2 text-sm text-warn/90">
                  <span className="font-semibold">Watch out: </span>
                  {c.caveat}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Conflicts */}
      <Section title={`Conflicts detected (${result.conflicts.length})`}>
        {result.conflicts.length === 0 ? (
          <p className="rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm text-accent">
            No conflicts — your choices fit together cleanly.
          </p>
        ) : (
          <ul className="space-y-3">
            {result.conflicts.map((c) => (
              <li key={c.id} className={`rounded-lg border p-4 ${SEVERITY_STYLES[c.severity]}`}>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide">{c.severity}</div>
                <p className="text-sm text-slate-200">{c.message}</p>
                <div className="mt-2">
                  <span className="text-xs font-semibold text-slate-300">How to fix:</span>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-300">
                    {c.fixes.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Debugging scenarios */}
      <Section title="5 production failures to debug">
        <div className="grid gap-3">
          {result.scenarios.map((s, i) => (
            <div key={s.id} className="rounded-lg border border-edge bg-panel/50 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger/20 text-xs font-bold text-danger">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-white">{s.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-brand">Check: {s.stage}</p>
                  <p className="mt-2 text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Likely cause: </span>
                    {s.cause}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    <span className="font-semibold text-accent">Fix: </span>
                    {s.fix}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Transformations */}
      <Section title="Transform into a different kind of app">
        <p className="mb-3 text-sm text-slate-400">
          Pick a target architecture to see exactly what you&apos;d change and why.
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {result.transformations.map((t) => (
            <button
              key={t.to}
              onClick={() => setTargetId(t.to)}
              className={[
                "rounded-full border px-3 py-1 text-sm transition",
                t.to === targetId
                  ? "border-brand bg-brand/15 text-brand"
                  : "border-edge bg-panel text-slate-300 hover:border-brand/60",
              ].join(" ")}
            >
              {t.name}
              <span className="ml-2 text-xs text-slate-500">{t.changeCount} changes</span>
            </button>
          ))}
        </div>

        {target && (
          <div className="rounded-xl border border-edge bg-panel/50 p-4">
            <p className="text-sm text-slate-400">
              To become a <span className="font-semibold text-white">{target.name}</span> (like{" "}
              {target.examples.join(", ")}):
            </p>
            {target.changes.length === 0 ? (
              <p className="mt-3 text-sm text-accent">
                Your current choices already match this architecture.
              </p>
            ) : (
              <div className="mt-3 overflow-hidden rounded-lg border border-edge">
                <table className="w-full text-left text-sm">
                  <thead className="bg-edge/40 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Area</th>
                      <th className="px-3 py-2">From → To</th>
                      <th className="px-3 py-2">Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {target.changes.map((ch) => (
                      <tr key={ch.questionId} className="border-t border-edge/60 align-top">
                        <td className="px-3 py-2 text-slate-400">{ch.category}</td>
                        <td className="px-3 py-2 text-slate-200">
                          <span className="text-slate-500">{ch.from}</span>
                          <span className="mx-1 text-brand">→</span>
                          <span className="text-white">{ch.to}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">{ch.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Section>

      <div className="mt-10 flex justify-center">
        <button
          onClick={onRestart}
          className="rounded-lg border border-brand bg-brand/15 px-6 py-3 font-semibold text-brand hover:bg-brand/25"
        >
          Build another architecture →
        </button>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}
