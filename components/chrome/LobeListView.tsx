"use client";

import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { LobeDefinition } from "@/lib/lobes";
import {
  NODE_TYPE_COLORS,
  NODE_TYPE_GLYPHS,
  type PositionedLobeGraph,
} from "@/lib/types/cognitive";

interface LobeListViewProps {
  lobe: LobeDefinition;
  graph: PositionedLobeGraph;
  onClose: () => void;
}

/**
 * "Explore as list" (docs/ui/09): the spatial graph as a keyboard-navigable,
 * screen-reader-first list grouped by cluster. Same data, same destinations.
 */
export function LobeListView({ lobe, graph, onClose }: LobeListViewProps) {
  const byCluster = graph.clusters.map((cluster) => ({
    cluster,
    nodes: graph.nodes.filter((n) => n.clusterId === cluster.id),
  }));
  const unclustered = graph.nodes.filter((n) => !n.clusterId);

  return (
    <GlassPanel
      role="region"
      aria-label={`${lobe.displayName} node list`}
      className="pointer-events-auto flex max-h-[70vh] w-full max-w-sm flex-col gap-3 overflow-y-auto p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-text-primary">
          {graph.nodes.length} nodes · {graph.clusters.length} constellations
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm px-1.5 text-sm text-text-muted hover:text-text-primary"
        >
          Close
        </button>
      </div>
      {[...byCluster, ...(unclustered.length ? [{ cluster: null, nodes: unclustered }] : [])].map(
        ({ cluster, nodes }) => (
          <section key={cluster?.id ?? "unclustered"} className="flex flex-col gap-1">
            <h3 className="text-[10px] tracking-[0.18em] text-text-muted uppercase">
              {cluster?.label ?? "Unclustered"}
            </h3>
            <ul className="flex flex-col">
              {nodes.map((node) => (
                <li key={node.id}>
                  <Link
                    href={`/brain/${lobe.id}/node/${encodeURIComponent(node.id)}`}
                    className="flex items-baseline gap-2 rounded-sm px-1.5 py-1 text-sm text-text-secondary hover:bg-space-800/70 hover:text-text-primary"
                  >
                    <span
                      aria-hidden="true"
                      style={{ color: NODE_TYPE_COLORS[node.type] }}
                    >
                      {NODE_TYPE_GLYPHS[node.type]}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{node.label}</span>
                    <span className="shrink-0 text-[10px] text-text-muted">
                      {node.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ),
      )}
    </GlassPanel>
  );
}
