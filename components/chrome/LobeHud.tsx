"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, List } from "lucide-react";
import { LobeListView } from "@/components/chrome/LobeListView";
import type { LobeDefinition } from "@/lib/lobes";
import { useLobeGraph } from "@/lib/data/useLobeGraph";
import { useSceneStore } from "@/lib/state/scene";

interface LobeHudProps {
  lobe: LobeDefinition;
  /** Extra breadcrumb tail (the selected node's label on node routes). */
  breadcrumbTail?: string;
}

/**
 * Shared lobe-interior chrome (docs/ui/01): breadcrumb, counts, and the
 * accessible list view — floats over the persistent scene without blocking it.
 */
export function LobeHud({ lobe, breadcrumbTail }: LobeHudProps) {
  const transition = useSceneStore((s) => s.transition);
  const { data: graph, isPending, isError, refetch } = useLobeGraph(lobe.id);
  const [listOpen, setListOpen] = useState(false);
  const arriving = transition !== null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-14 bottom-0 z-(--z-panel) flex flex-col gap-3 p-5 transition-opacity duration-(--dur-fast)"
      style={{ opacity: arriving ? 0 : 1 }}
      aria-hidden={arriving}
    >
      <div className="flex items-start justify-between gap-4">
        <nav aria-label="Breadcrumb" className="pointer-events-auto">
          <ol className="flex items-center gap-1.5 text-sm">
            <li>
              <Link
                href="/brain"
                className="text-text-secondary hover:text-text-primary"
              >
                Brain
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
            </li>
            <li
              aria-current={breadcrumbTail ? undefined : "page"}
              style={{ color: lobe.color }}
            >
              {breadcrumbTail ? (
                <Link href={`/brain/${lobe.id}`} className="hover:underline">
                  {lobe.displayName}
                </Link>
              ) : (
                lobe.displayName
              )}
            </li>
            {breadcrumbTail ? (
              <>
                <li aria-hidden="true">
                  <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
                </li>
                <li aria-current="page" className="max-w-56 truncate text-text-primary">
                  {breadcrumbTail}
                </li>
              </>
            ) : null}
          </ol>
        </nav>

        <div className="pointer-events-auto flex items-center gap-3">
          {graph ? (
            <span className="text-xs text-text-muted">
              {graph.nodes.length} nodes · {graph.crossLobeEdgeCount} pathways
              beyond
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setListOpen((v) => !v)}
            aria-expanded={listOpen}
            className="inline-flex items-center gap-1.5 rounded-md border border-space-700 bg-space-800/60 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
          >
            <List aria-hidden="true" className="h-4 w-4" />
            Explore as list
          </button>
        </div>
      </div>

      {isPending ? (
        <p role="status" className="text-xs tracking-[0.14em] text-text-muted uppercase">
          Constellating…
        </p>
      ) : null}
      {isError ? (
        <p role="status" className="pointer-events-auto text-sm text-danger">
          The twin&apos;s memory is unreachable.{" "}
          <button
            type="button"
            onClick={() => refetch()}
            className="font-medium text-neural-cyan hover:underline"
          >
            Retry
          </button>
        </p>
      ) : null}

      {listOpen && graph ? (
        <div className="flex justify-end">
          <LobeListView
            lobe={lobe}
            graph={graph}
            onClose={() => setListOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
