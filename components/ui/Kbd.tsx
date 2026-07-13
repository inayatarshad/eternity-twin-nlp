export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-sm border border-space-700 bg-space-800 px-1.5 py-0.5 font-mono text-xs text-text-secondary shadow-[inset_0_-1px_0_rgba(0,0,0,0.6)]">
      {children}
    </kbd>
  );
}
