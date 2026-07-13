import { cn } from "@/lib/cn";

interface MeterProps {
  label: string;
  /** 0–1 scalar (docs/ui/02: intensity, confidence, relevance, recency). */
  value: number;
  /** CSS color for the fill; defaults to the contextual lobe glow hue. */
  accent?: string;
  className?: string;
}

function describe(value: number): string {
  if (value >= 0.75) return "high";
  if (value >= 0.4) return "medium";
  return "low";
}

/**
 * Scalar meter. Uses role="meter" on a styled element rather than native
 * <meter> for consistent cross-browser rendering (decision P-M1, docs/ui/11);
 * value is also always given as text, never bar-only.
 */
export function Meter({ label, value, accent, className }: MeterProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const pct = Math.round(clamped * 100);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="w-28 shrink-0 text-sm text-text-secondary">{label}</span>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct}% — ${describe(clamped)}`}
        className="h-1.5 flex-1 overflow-hidden rounded-pill bg-space-700"
      >
        <div
          className="h-full rounded-pill transition-[width] duration-(--dur-fast)"
          style={{
            width: `${pct}%`,
            background: accent ?? "var(--color-neural-cyan)",
          }}
        />
      </div>
      <span className="w-20 shrink-0 text-right font-mono text-xs text-text-muted">
        {pct}% <span aria-hidden="true">·</span> {describe(clamped)}
      </span>
    </div>
  );
}
