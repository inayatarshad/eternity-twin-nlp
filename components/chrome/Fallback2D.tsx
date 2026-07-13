"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LOBES } from "@/lib/lobes";

/**
 * 2D brain map — rendered when WebGL is unavailable or the user chooses the
 * 2D tier (docs/ui/09: a complete mode, not an apology). Phase 2 stub: the
 * labeled lobe map; interactivity arrives with Phase 3, the 2D graph with
 * Phase 9.
 */

/** Hand-placed 2D layout of the six lobes (side view, facing right). */
const LAYOUT_2D: Record<string, { cx: number; cy: number; rx: number; ry: number }> = {
  frontal: { cx: 260, cy: 118, rx: 74, ry: 62 },
  parietal: { cx: 158, cy: 92, rx: 78, ry: 54 },
  occipital: { cx: 72, cy: 138, rx: 52, ry: 48 },
  temporal: { cx: 150, cy: 196, rx: 68, ry: 42 },
  limbic: { cx: 178, cy: 148, rx: 40, ry: 28 },
  core: { cx: 182, cy: 150, rx: 14, ry: 14 },
};

export function Fallback2D() {
  const router = useRouter();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
      <header className="text-center">
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">
          Eternity Twin — 2D mode
        </p>
        <h1 className="font-display text-3xl text-text-primary">The brain</h1>
      </header>

      <svg
        viewBox="0 0 340 260"
        role="img"
        aria-label="Map of the six cognitive lobes"
        className="w-full max-w-md"
      >
        {LOBES.map((lobe) => {
          const p = LAYOUT_2D[lobe.id]!;
          return (
            /* pointer shortcut only — the accessible path is the legend links */
            <g
              key={lobe.id}
              aria-hidden="true"
              className="cursor-pointer"
              onClick={() => router.push(`/brain/${lobe.id}`)}
            >
              <ellipse
                cx={p.cx}
                cy={p.cy}
                rx={p.rx}
                ry={p.ry}
                fill={lobe.color}
                fillOpacity={lobe.id === "core" ? 0.9 : 0.14}
                stroke={lobe.color}
                strokeOpacity={0.7}
                strokeWidth={1.5}
              />
            </g>
          );
        })}
      </svg>

      <ul className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
        {LOBES.map((lobe) => (
          <li key={lobe.id}>
            <Link
              href={`/brain/${lobe.id}`}
              className="flex items-start gap-2.5 rounded-md border border-space-700 bg-space-800/40 px-3 py-2 transition-colors duration-(--dur-instant) hover:border-text-muted"
            >
              <span
                aria-hidden="true"
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: lobe.color }}
              />
              <span className="flex flex-col">
                <span className="text-sm text-text-primary">{lobe.displayName}</span>
                <span className="text-xs text-text-secondary">{lobe.tagline}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="max-w-md text-center text-xs text-text-muted">
        The full three-dimensional experience needs WebGL2. You can switch
        modes any time in Settings.
      </p>
    </div>
  );
}
