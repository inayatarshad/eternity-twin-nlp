import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Action slot (button/link). */
  children?: React.ReactNode;
  className?: string;
}

/** Empty state — never a blank void (docs/ui/01). */
export function EmptyState({
  icon,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div aria-hidden="true" className="text-text-muted [&>svg]:h-8 [&>svg]:w-8">
          {icon}
        </div>
      ) : null}
      <p className="font-display text-lg text-text-primary">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-text-secondary">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
