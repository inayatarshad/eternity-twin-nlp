"use client";

import { Html } from "@react-three/drei";
import type { LobeDefinition } from "@/lib/lobes";
import type { LobeVisualState } from "@/components/scene/BrainLobe";

/**
 * Screen-space label anchored near a lobe (docs/ui/06). Phase 3: reacts to
 * attention — idle shows the name quietly; attended brightens, reveals the
 * tagline and the enter hint; dimmed recedes (docs/ui/03 Flow 3).
 */
export function LobeLabel({
  lobe,
  state,
}: {
  lobe: LobeDefinition;
  state: LobeVisualState;
}) {
  const dir = lobe.labelDirection;
  const len = Math.hypot(...dir) || 1;
  const distance = lobe.id === "core" ? 1.1 : 1.55;
  const anchor: [number, number, number] = [
    lobe.position[0] + (dir[0] / len) * distance * lobe.scale[0],
    lobe.position[1] + (dir[1] / len) * distance * lobe.scale[1],
    lobe.position[2] + (dir[2] / len) * distance * lobe.scale[2],
  ];
  const opacity = state === "attended" ? 1 : state === "dimmed" ? 0.25 : 0.7;
  return (
    <Html
      position={anchor}
      center
      zIndexRange={[10, 10]} /* --z-scene-labels stratum */
      style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
    >
      <div
        data-lobe-label={lobe.id}
        data-state={state}
        className="flex flex-col items-center gap-0.5 text-center transition-opacity duration-(--dur-fast) select-none"
        style={{ opacity }}
      >
        <span
          className="text-[11px] font-medium tracking-[0.14em] uppercase"
          style={{ color: lobe.color, textShadow: "var(--label-shadow)" }}
        >
          {lobe.displayName}
        </span>
        <span
          className="text-[10px] text-text-secondary transition-opacity duration-(--dur-fast)"
          style={{
            textShadow: "var(--label-shadow)",
            opacity: state === "attended" ? 1 : 0,
          }}
        >
          {lobe.tagline} · press Enter to explore
        </span>
      </div>
    </Html>
  );
}
