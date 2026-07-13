"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useToast } from "@/components/ui/Toast";
import { LobeHud } from "@/components/chrome/LobeHud";
import { getLobeById, isLobeId } from "@/lib/lobes";
import { useLobeGraph } from "@/lib/data/useLobeGraph";

/**
 * Lobe interior (docs/ui/01): the knowledge graph renders in the persistent
 * scene behind this route; the page contributes the HUD — and an empty state
 * only when the lobe genuinely has no nodes.
 */
export default function LobePage() {
  const params = useParams<{ lobe: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const slug = params.lobe;
  const lobe = isLobeId(slug) ? getLobeById(slug) : undefined;
  const { data: graph } = useLobeGraph(lobe?.id ?? null);

  // Unknown region → land on the brain with a notice (docs/ui/01 error states).
  useEffect(() => {
    if (!lobe) {
      toast("That region of the mind could not be found.", { kind: "error" });
      router.replace("/brain");
    }
  }, [lobe, router, toast]);

  // Esc returns to the brain (docs/ui/01 back and return flows).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/brain");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (!lobe) return null;

  return (
    <>
      <LobeHud lobe={lobe} />
      {graph && graph.nodes.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-(--z-panel) flex items-center justify-center p-6">
          <GlassPanel className="pointer-events-auto max-w-md">
            <EmptyState
              icon={<Sparkles />}
              title="No memories have formed here yet"
              description="When the twin experiences this domain, its knowledge will constellate in this space."
            >
              <Link
                href="/brain"
                className="rounded-md border border-space-700 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
              >
                Return to the brain
              </Link>
            </EmptyState>
          </GlassPanel>
        </div>
      ) : null}
      <p className="pointer-events-none absolute inset-x-0 bottom-5 z-(--z-chrome) text-center text-xs tracking-[0.14em] text-text-muted uppercase">
        Select a node · drag to orbit · Esc returns to the brain
      </p>
    </>
  );
}
