"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { colorTokens, type ColorTokenName } from "@/lib/tokens/colors";
import { contrastRatio } from "@/lib/tokens/contrast";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Meter } from "@/components/ui/Meter";
import { Chip } from "@/components/ui/Chip";
import { Kbd } from "@/components/ui/Kbd";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

/** Dev-only token gallery — the Phase 1 calibration surface (docs/ui/10). */

const SWATCH_GROUPS: Array<{ title: string; tokens: ColorTokenName[] }> = [
  { title: "Space", tokens: ["space-950", "space-900", "space-800", "space-700"] },
  {
    title: "Lobe accents",
    tokens: [
      "neural-cyan",
      "emotion-magenta",
      "memory-violet",
      "association-teal",
      "perception-blue",
      "consciousness-gold",
    ],
  },
  { title: "Text", tokens: ["text-primary", "text-secondary", "text-muted"] },
  { title: "Semantic", tokens: ["positive", "warning", "danger", "focus"] },
];

const TEXT_TOKENS: ColorTokenName[] = [
  "text-primary",
  "text-secondary",
  "text-muted",
];

const TYPE_SCALE = [
  { name: "--text-xs", rem: 0.694 },
  { name: "--text-sm", rem: 0.833 },
  { name: "--text-base", rem: 1 },
  { name: "--text-lg", rem: 1.25 },
  { name: "--text-xl", rem: 1.563 },
  { name: "--text-2xl", rem: 1.953 },
  { name: "--text-3xl", rem: 2.441 },
  { name: "--text-display", rem: 3.5 },
];

const SPACING = [4, 8, 12, 16, 24, 32, 48, 64];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

export default function TokenGalleryPage() {
  const { toast } = useToast();
  const [chips, setChips] = useState<Record<string, boolean>>({
    memory: true,
    emotion: false,
    concept: false,
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-12 px-6 py-12">
      <nav aria-label="Breadcrumb">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Home
        </Link>
      </nav>

      <header>
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">
          dev / calibration
        </p>
        <h1 className="font-display text-4xl text-text-primary">
          Token gallery
        </h1>
      </header>

      <Section title="Color">
        <div className="flex flex-col gap-6">
          {SWATCH_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-text-secondary">
                {group.title}
              </h3>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.tokens.map((name) => (
                  <li
                    key={name}
                    className="flex items-center gap-3 rounded-md border border-space-700 p-2"
                  >
                    <span
                      aria-hidden="true"
                      className="h-9 w-9 shrink-0 rounded-sm border border-space-700"
                      style={{ background: colorTokens[name] }}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm text-text-primary">
                        {name}
                      </span>
                      <span className="font-mono text-xs text-text-muted">
                        {colorTokens[name]}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Text contrast (WCAG)">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Contrast ratios of text tokens over surface tokens
          </caption>
          <thead>
            <tr className="text-left text-text-secondary">
              <th scope="col" className="border-b border-space-700 py-2 pr-4 font-medium">
                Text token
              </th>
              {(["space-950", "space-900", "space-800"] as const).map((bg) => (
                <th key={bg} scope="col" className="border-b border-space-700 py-2 pr-4 font-medium">
                  on {bg}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TEXT_TOKENS.map((text) => (
              <tr key={text}>
                <th scope="row" className="py-2 pr-4 text-left font-normal text-text-primary">
                  {text}
                </th>
                {(["space-950", "space-900", "space-800"] as const).map(
                  (bg) => {
                    const ratio = contrastRatio(
                      colorTokens[text],
                      colorTokens[bg],
                    );
                    const pass = ratio >= 4.5;
                    return (
                      <td key={bg} className="py-2 pr-4 font-mono text-xs">
                        <span
                          style={{
                            color: pass
                              ? "var(--color-positive)"
                              : "var(--color-danger)",
                          }}
                        >
                          {ratio.toFixed(2)}:1 {pass ? "AA" : "FAIL"}
                        </span>
                      </td>
                    );
                  },
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-3">
          <p className="font-display text-3xl">
            Instrument Serif — the celestial voice
          </p>
          <p className="text-base">
            Inter — workhorse UI text. Tabular numerals: 0123456789.
          </p>
          <p className="font-mono text-sm">
            JetBrains Mono — provenance, IDs, timestamps.
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {TYPE_SCALE.map((step) => (
              <li key={step.name} className="flex items-baseline gap-4">
                <span className="w-32 shrink-0 font-mono text-xs text-text-muted">
                  {step.name}
                </span>
                <span
                  className="truncate text-text-primary"
                  style={{ fontSize: `${step.rem}rem` }}
                >
                  Memory constellations
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title="Spacing & radius">
        <div className="flex flex-wrap items-end gap-3">
          {SPACING.map((px) => (
            <div key={px} className="flex flex-col items-center gap-1">
              <div
                aria-hidden="true"
                className="w-4 bg-neural-cyan/40"
                style={{ height: px }}
              />
              <span className="font-mono text-xs text-text-muted">{px}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {(["sm", "md", "lg", "pill"] as const).map((r) => (
            <div
              key={r}
              className="border border-space-700 bg-space-800 px-4 py-2 text-sm text-text-secondary"
              style={{ borderRadius: `var(--radius-${r})` }}
            >
              radius-{r}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Glass & glow">
        <div className="relative overflow-hidden rounded-lg border border-space-700 p-8">
          {/* busy backdrop to prove the blur */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(circle at 20% 30%, rgba(94,230,255,0.35), transparent 40%), radial-gradient(circle at 70% 60%, rgba(255,94,168,0.3), transparent 45%), radial-gradient(circle at 45% 85%, rgba(157,123,255,0.3), transparent 40%)",
            }}
          />
          <GlassPanel className="relative z-10 max-w-sm p-5">
            <p className="text-sm text-text-primary">Glass surface</p>
            <p className="mt-1 text-xs text-text-secondary">
              --glass-surface + --glass-blur + hairline border + top highlight.
            </p>
          </GlassPanel>
        </div>
        <div className="flex flex-wrap gap-8 pt-4">
          {(
            [
              ["glow-soft", "var(--glow-soft)"],
              ["glow-active", "var(--glow-active)"],
              ["glow-focus", "var(--glow-focus)"],
            ] as const
          ).map(([name, shadow]) => (
            <div key={name} className="flex flex-col items-center gap-3">
              <div
                aria-hidden="true"
                className="h-12 w-12 rounded-full bg-neural-cyan/20"
                style={{ boxShadow: shadow }}
              />
              <span className="font-mono text-xs text-text-muted">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Primitives">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(chips).map(([key, pressed]) => (
              <Chip
                key={key}
                pressed={pressed}
                onPressedChange={(next) =>
                  setChips((c) => ({ ...c, [key]: next }))
                }
              >
                {key}
              </Chip>
            ))}
            <Chip
              pressed={false}
              onPressedChange={() => {}}
              disabled
              disabledReason="No insight nodes exist yet"
            >
              insight
            </Chip>
          </div>

          <div className="flex max-w-md flex-col gap-2">
            <Meter label="Intensity" value={0.82} accent="var(--color-emotion-magenta)" />
            <Meter label="Confidence" value={0.49} accent="var(--color-neural-cyan)" />
            <Meter label="Recency" value={0.15} accent="var(--color-memory-violet)" />
          </div>

          <p className="text-sm text-text-secondary">
            Open search with <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> — keyboard hints use
            the Kbd primitive.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => toast("The twin's memory is unreachable.", { kind: "error", action: { label: "Retry", onClick: () => {} } })}
              className="rounded-md border border-space-700 bg-space-800/60 px-4 py-2 text-sm text-text-primary hover:border-danger/60"
            >
              Trigger error toast
            </button>
            <button
              type="button"
              onClick={() => toast("Preferences saved.", { kind: "success" })}
              className="rounded-md border border-space-700 bg-space-800/60 px-4 py-2 text-sm text-text-primary hover:border-positive/60"
            >
              Trigger success toast
            </button>
          </div>

          <GlassPanel className="max-w-md">
            <EmptyState
              icon={<Sparkles />}
              title="No memories have formed here yet"
              description="When the twin experiences this scenario, its memories will constellate in this space."
            >
              <button
                type="button"
                className="rounded-md border border-space-700 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
              >
                Learn how data arrives
              </button>
            </EmptyState>
          </GlassPanel>
        </div>
      </Section>
    </main>
  );
}
