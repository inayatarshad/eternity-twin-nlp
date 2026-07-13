"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useEffectiveReducedMotion } from "@/components/ClientPreferences";
import { useEffectiveTheme } from "@/components/ClientPreferences";
import {
  type MotionPreference,
  type PerfTier,
  type ThemePreference,
  useAnimationStore,
} from "@/lib/state/animation";

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  description: string;
}> = [
  {
    value: "system",
    label: "Follow system",
    description: "Match the operating system's light/dark preference.",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Deep space — the mind against the void.",
  },
  {
    value: "light",
    label: "Light",
    description: "Bright clinical space with a grounded brain.",
  },
];

const MOTION_OPTIONS: Array<{
  value: MotionPreference;
  label: string;
  description: string;
}> = [
  {
    value: "system",
    label: "Follow system",
    description: "Use the operating system's reduced-motion preference.",
  },
  {
    value: "reduced",
    label: "Reduced",
    description:
      "Replace camera flights with crossfades; disable ambient motion.",
  },
  {
    value: "full",
    label: "Full",
    description: "All cinematic motion, even if the OS prefers reduced.",
  },
];

const TIER_OPTIONS: Array<{
  value: PerfTier;
  label: string;
  description: string;
}> = [
  { value: "auto", label: "Auto", description: "Detect at startup (Phase 2)." },
  { value: "high", label: "High", description: "Full effects, 60 fps target." },
  {
    value: "medium",
    label: "Medium",
    description: "Half-resolution bloom, fewer particles.",
  },
  {
    value: "low",
    label: "Low",
    description: "Post-processing off, sprite glows.",
  },
  {
    value: "fallback2d",
    label: "2D mode",
    description: "No WebGL — complete 2D experience.",
  },
];

function RadioGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: Array<{ value: T; label: string; description: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-text-primary">
        {legend}
      </legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-start gap-3 rounded-md border border-space-700 bg-space-800/40 px-3 py-2.5 transition-colors duration-(--dur-instant) has-checked:border-neural-cyan/60 has-checked:bg-neural-cyan/10"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-1 accent-(--color-neural-cyan)"
          />
          {/* description is text-secondary, not muted: the checked row's cyan
              tint lightens the surface past muted's contrast floor (docs/ui/04) */}
          <span className="flex flex-col gap-0.5">
            <span className="text-sm text-text-primary">{option.label}</span>
            <span className="text-xs text-text-secondary">
              {option.description}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export default function SettingsPage() {
  const motionPreference = useAnimationStore((s) => s.motionPreference);
  const setMotionPreference = useAnimationStore((s) => s.setMotionPreference);
  const perfTier = useAnimationStore((s) => s.perfTier);
  const setPerfTier = useAnimationStore((s) => s.setPerfTier);
  const highLegibility = useAnimationStore((s) => s.highLegibility);
  const setHighLegibility = useAnimationStore((s) => s.setHighLegibility);
  const themePreference = useAnimationStore((s) => s.themePreference);
  const setThemePreference = useAnimationStore((s) => s.setThemePreference);
  const effectiveReduced = useEffectiveReducedMotion();
  const effectiveTheme = useEffectiveTheme();

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-12">
      <nav aria-label="Breadcrumb">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Home
        </Link>
      </nav>

      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">
          Motion, performance, and legibility. Preferences persist on this
          device.
        </p>
      </header>

      <GlassPanel className="flex flex-col gap-6 p-6">
        <RadioGroup
          legend="Theme"
          name="theme"
          options={THEME_OPTIONS}
          value={themePreference}
          onChange={setThemePreference}
        />
        <p aria-live="polite" className="text-xs text-text-muted">
          Effective right now:{" "}
          <span className="font-mono text-text-secondary">
            {effectiveTheme} mode
          </span>
        </p>
      </GlassPanel>

      <GlassPanel className="flex flex-col gap-6 p-6">
        <RadioGroup
          legend="Motion"
          name="motion"
          options={MOTION_OPTIONS}
          value={motionPreference}
          onChange={setMotionPreference}
        />
        <p aria-live="polite" className="text-xs text-text-muted">
          Effective right now:{" "}
          <span className="font-mono text-text-secondary">
            {effectiveReduced ? "reduced motion" : "full motion"}
          </span>
        </p>
      </GlassPanel>

      <GlassPanel className="flex flex-col gap-6 p-6">
        <RadioGroup
          legend="Performance tier"
          name="perf-tier"
          options={TIER_OPTIONS}
          value={perfTier}
          onChange={setPerfTier}
        />
      </GlassPanel>

      <GlassPanel className="p-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={highLegibility}
            onChange={(e) => setHighLegibility(e.target.checked)}
            className="mt-1 accent-(--color-neural-cyan)"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-text-primary">
              High legibility
            </span>
            <span className="text-xs text-text-secondary">
              Raises the dimmed-content floor, thickens graph edges, and
              disables chromatic aberration.
            </span>
          </span>
        </label>
      </GlassPanel>
    </main>
  );
}
