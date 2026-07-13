import { computeLayout, type LayoutInput } from "@/lib/scene/graphLayout";

/** Graph layout off the main thread (docs/ui/08, Phase 5 AC). */
self.onmessage = (event: MessageEvent<LayoutInput>) => {
  const positions = computeLayout(event.data);
  (self as unknown as Worker).postMessage(positions, [positions.buffer]);
};
