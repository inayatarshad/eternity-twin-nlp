"use client";

import { useQuery } from "@tanstack/react-query";
import type { LobeId } from "@/lib/lobes";
import type { PositionedLobeGraph } from "@/lib/types/cognitive";
import { activeProvider } from "@/lib/data/provider";
import { computeLayout, type LayoutInput } from "@/lib/scene/graphLayout";

/** Run the force layout in a Web Worker; inline fallback if workers fail. */
function layoutOffThread(input: LayoutInput): Promise<Float32Array> {
  return new Promise((resolve) => {
    try {
      const worker = new Worker(
        new URL("../workers/layout.worker.ts", import.meta.url),
      );
      worker.onmessage = (e: MessageEvent<Float32Array>) => {
        worker.terminate();
        resolve(e.data);
      };
      worker.onerror = () => {
        worker.terminate();
        resolve(computeLayout(input));
      };
      worker.postMessage(input);
    } catch {
      resolve(computeLayout(input));
    }
  });
}

/**
 * Lobe graph + settled layout, cached per lobe for the session
 * (docs/ui/07 rule 4: immutable snapshots; revisits are instant).
 */
export function useLobeGraph(lobeId: LobeId | null) {
  return useQuery<PositionedLobeGraph>({
    queryKey: ["lobeGraph", lobeId],
    enabled: lobeId !== null,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const graph = await activeProvider.getLobeGraph(lobeId!);
      const positions = await layoutOffThread({
        nodes: graph.nodes.map((n) => ({ id: n.id, clusterId: n.clusterId })),
        edges: graph.edges.map((e) => ({
          sourceId: e.sourceId,
          targetId: e.targetId,
          strength: e.strength,
        })),
      });
      return { ...graph, positions };
    },
  });
}
