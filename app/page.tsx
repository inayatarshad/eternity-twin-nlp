import Link from "next/link";

/**
 * Placeholder home. The real Awakening experience (docs/ui/03 Flow 1) arrives
 * in Phase 2 with the brain scene; this page only proves the foundation.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <div
        aria-hidden="true"
        className="h-24 w-24 rounded-full bg-neural-cyan/10 shadow-(--glow-active)"
      />
      <div className="flex flex-col gap-3">
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">
          Eternity Twin
        </p>
        <h1 className="font-display text-5xl text-text-primary">
          A mind you can enter
        </h1>
        <p className="mx-auto max-w-md text-text-secondary">
          Explore the mind of a digital twin as a luminous, navigable
          universe — six cognitive regions, one living interior.
        </p>
      </div>
      <nav aria-label="Foundation pages" className="flex flex-wrap justify-center gap-4">
        <Link
          href="/brain"
          className="rounded-md border border-consciousness-gold/50 bg-consciousness-gold/10 px-4 py-2 text-sm text-text-primary transition-colors duration-(--dur-instant) hover:border-consciousness-gold"
        >
          Enter the brain
        </Link>
        <Link
          href="/how-it-works"
          className="rounded-md border border-space-700 bg-space-800/60 px-4 py-2 text-sm text-text-primary transition-colors duration-(--dur-instant) hover:border-neural-cyan/60"
        >
          Read how it works
        </Link>
        <Link
          href="/dev/tokens"
          className="rounded-md border border-space-700 bg-space-800/60 px-4 py-2 text-sm text-text-primary transition-colors duration-(--dur-instant) hover:border-neural-cyan/60"
        >
          Token gallery
        </Link>
        <Link
          href="/settings"
          className="rounded-md border border-space-700 bg-space-800/60 px-4 py-2 text-sm text-text-primary transition-colors duration-(--dur-instant) hover:border-neural-cyan/60"
        >
          Settings
        </Link>
      </nav>
    </main>
  );
}
