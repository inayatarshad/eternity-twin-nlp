"use client";

import { cn } from "@/lib/cn";

interface ChipProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
}

/** Toggle chip — filter surface primitive (docs/ui/03 Flow 9). */
export function Chip({
  pressed,
  onPressedChange,
  children,
  disabled,
  disabledReason,
  className,
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-disabled={disabled || undefined}
      title={disabled ? disabledReason : undefined}
      onClick={() => {
        if (!disabled) onPressedChange(!pressed);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-sm transition-colors duration-(--dur-instant)",
        pressed
          ? "border-neural-cyan/60 bg-neural-cyan/15 text-text-primary"
          : "border-space-700 bg-space-800/60 text-text-secondary hover:border-text-muted hover:text-text-primary",
        disabled && "cursor-not-allowed opacity-40 hover:border-space-700 hover:text-text-secondary",
        className,
      )}
    >
      {children}
    </button>
  );
}
