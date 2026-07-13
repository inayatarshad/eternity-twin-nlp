"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type GlassPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Heavier blur for prominent overlays (command palette). */
  heavy?: boolean;
};

/**
 * Glass material surface (docs/ui/04). Rule: never stack more than two glass
 * layers; the material carries its own hairline border + top edge highlight.
 */
export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  function GlassPanel({ className, heavy, style, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn("glass", className)}
        style={
          heavy
            ? { ...style, backdropFilter: "blur(var(--glass-blur-heavy))" }
            : style
        }
        {...rest}
      />
    );
  },
);
