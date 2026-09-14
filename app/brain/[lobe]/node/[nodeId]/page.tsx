"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Meter } from "@/components/ui/Meter";
import { useToast } from "@/components/ui/Toast";
import { LobeHud } from "@/components/chrome/LobeHud";
import { SaidVsFeltPanel } from "@/components/chrome/SaidVsFeltPanel";
import { getLobeById, isLobeId } from "@/lib/lobes";
import { activeProvider } from "@/lib/data/provider";
import { getExchange } from "@/lib/data/saidVsFelt";
import {
  NODE_TYPE_COLORS,
  NODE_TYPE_GLYPHS,
} from "@/lib/types/cognitive";
import { useSceneStore } from "@/lib/state/scene";

/**
 * Node selection route. Nodes backed by the said-vs-felt NLP pipeline show the
 * full provenance panel (felt vs. said, detected emotions, model scores, verdict
 * vs. human label); other nodes show their scalar meters.
 */
export default function NodePage() {
  const params = useParams<{ lobe: string; nodeId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const transition = useSceneStore((s) => s.transition);
  const slug = params.lobe;
  const nodeId = decodeURIComponent(params.nodeId);
  const lobe = isLobeId(slug) ? getLobeById(slug) : undefined;

  const { data: detail, isPending } = useQuery({
    queryKey: ["nodeDetail", nodeId],
    queryFn: () => activeProvider.getNodeDetail(nodeId),
    staleTime: Infinity,
  });

  // unknown node → back to the lobe with a notice
  useEffect(() => {
    if (!lobe || (detail === null && !isPending)) {
      toast("That memory could not be found.", { kind: "error" });
      router.replace(lobe ? `/brain/${lobe.id}` : "/brain");
    }
  }, [lobe, detail, isPending, router, toast]);

  // Esc deselects → back to the lobe (docs/ui/01)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lobe) router.push(`/brain/${lobe.id}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, lobe]);

  if (!lobe) return null;
  const node = detail?.node;
  const exchangeId = node?.metadata?.exchangeId;
  const exchange = typeof exchangeId === "string" ? getExchange(exchangeId) : undefined;
  const arriving = transition !== null;

  return (
    <>
      <LobeHud lobe={lobe} breadcrumbTail={node?.label ?? "…"} />
      <aside
        aria-label="Node inspector"
        className={`pointer-events-none absolute inset-y-0 right-0 z-(--z-panel) flex w-full items-center p-5 pt-24 transition-opacity duration-(--dur-fast) ${exchange ? "max-w-md" : "max-w-sm"}`}
        style={{ opacity: arriving ? 0 : 1 }}
        aria-hidden={arriving}
      >
        <GlassPanel className="pointer-events-auto flex max-h-[80vh] w-full flex-col gap-4 overflow-y-auto p-5">
          {node ? (
            <>
              <header className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span
                    className="text-xs tracking-[0.14em] uppercase"
                    style={{ color: NODE_TYPE_COLORS[node.type] }}
                  >
                    {NODE_TYPE_GLYPHS[node.type]} {node.type}
                  </span>
                  <h1 className="font-display text-2xl text-text-primary">
                    {node.label}
                  </h1>
                </div>
                <Link
                  href={`/brain/${lobe.id}`}
                  aria-label="Close inspector"
                  className="rounded-sm p-1 text-text-muted hover:text-text-primary"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </Link>
              </header>

              {node.summary ? (
                <p className="text-sm text-text-secondary">{node.summary}</p>
              ) : null}

              {exchange ? (
                <SaidVsFeltPanel exchange={exchange} />
              ) : (
                <div className="flex flex-col gap-2">
                  <Meter label="Intensity" value={node.intensity} accent="var(--color-emotion-magenta)" />
                  <Meter label="Confidence" value={node.confidence} accent="var(--color-neural-cyan)" />
                  <Meter label="Relevance" value={node.relevance} accent="var(--color-association-teal)" />
                  <Meter label="Recency" value={node.recency} accent="var(--color-memory-violet)" />
                </div>
              )}

              <section className="flex flex-col gap-1.5">
                <h2 className="text-xs tracking-[0.14em] text-text-muted uppercase">
                  Relationships ({detail!.neighbors.length})
                </h2>
                <ul className="flex flex-col">
                  {detail!.neighbors.slice(0, 14).map(({ edge, node: other }) => (
                    <li key={edge.id}>
                      <Link
                        href={`/brain/${other.lobeId}/node/${encodeURIComponent(other.id)}`}
                        className="flex items-baseline gap-2 rounded-sm px-1.5 py-1 text-sm text-text-secondary hover:bg-space-800/70 hover:text-text-primary"
                      >
                        <span className="shrink-0 font-mono text-[10px] text-text-muted">
                          {edge.type.replace("_", " ")}
                        </span>
                        <span
                          aria-hidden="true"
                          style={{ color: NODE_TYPE_COLORS[other.type] }}
                        >
                          {NODE_TYPE_GLYPHS[other.type]}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{other.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <p className="text-center text-xs tracking-[0.14em] text-text-muted uppercase">
                Esc deselects
              </p>
            </>
          ) : (
            <p role="status" className="text-sm text-text-secondary">
              Recalling…
            </p>
          )}
        </GlassPanel>
      </aside>
    </>
  );
}
