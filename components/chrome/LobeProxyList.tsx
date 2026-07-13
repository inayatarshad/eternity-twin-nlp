"use client";

import { useRef, useState } from "react";
import { LOBES, type LobeId } from "@/lib/lobes";

interface LobeProxyListProps {
  onAttend: (id: LobeId | null) => void;
  onActivate: (id: LobeId) => void;
}

/**
 * DOM twin of the 3D lobes (docs/ui/09): one tab stop, arrow keys rove
 * between six focusable proxies. The visible focus indication is the lobe's
 * brightening + revealed tooltip in the scene; screen readers get the full
 * name, summary, and hint from the accessible name.
 */
export function LobeProxyList({ onAttend, onActivate }: LobeProxyListProps) {
  const [focusIndex, setFocusIndex] = useState(0);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const moveFocus = (next: number) => {
    const clamped = (next + LOBES.length) % LOBES.length;
    setFocusIndex(clamped);
    refs.current[clamped]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        moveFocus(focusIndex + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        moveFocus(focusIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        moveFocus(0);
        break;
      case "End":
        e.preventDefault();
        moveFocus(LOBES.length - 1);
        break;
    }
  };

  return (
    <nav
      aria-label="Cognitive regions. Use the arrow keys to move between lobes."
      onKeyDown={onKeyDown}
    >
      <ul className="sr-only-list m-0 list-none p-0">
        {LOBES.map((lobe, i) => (
          <li key={lobe.id}>
            <button
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              tabIndex={i === focusIndex ? 0 : -1}
              aria-label={`${lobe.displayName}. ${lobe.tagline}. Press Enter to explore.`}
              className="sr-only"
              onFocus={() => {
                setFocusIndex(i);
                onAttend(lobe.id);
              }}
              onBlur={() => onAttend(null)}
              onClick={() => onActivate(lobe.id)}
            >
              {lobe.displayName}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
