import { create } from "zustand";
import type { LobeId } from "@/lib/lobes";
import type { PositionedLobeGraph } from "@/lib/types/cognitive";

/**
 * Shared scene state (docs/ui/07 NavigationState/CameraState subset).
 * `view` is derived from the URL by the /brain layout — the URL is the source
 * of truth; the TransitionDirector reacts to view changes and owns `transition`.
 */

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export interface SceneTransition {
  kind: "enter" | "exit";
  lobeId: LobeId;
}

export type BrainView = "brain" | LobeId;

interface SceneState {
  view: BrainView;
  attended: LobeId | null;
  pulse: { id: LobeId; count: number } | null;
  transition: SceneTransition | null;
  savedBrainPose: CameraPose | null;
  announcement: string;
  /** Positioned graph for the current lobe (set by the /brain layout). */
  graph: PositionedLobeGraph | null;
  hoveredNodeId: string | null;
  /** URL-derived (docs/ui/07: URL is the source of truth). */
  selectedNodeId: string | null;
  setView: (view: BrainView) => void;
  setAttended: (id: LobeId | null) => void;
  firePulse: (id: LobeId) => void;
  setTransition: (t: SceneTransition | null) => void;
  saveBrainPose: (pose: CameraPose) => void;
  announce: (message: string) => void;
  setGraph: (graph: PositionedLobeGraph | null) => void;
  setHoveredNodeId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
}

export const useSceneStore = create<SceneState>()((set) => ({
  view: "brain",
  attended: null,
  pulse: null,
  transition: null,
  savedBrainPose: null,
  announcement: "",
  graph: null,
  hoveredNodeId: null,
  selectedNodeId: null,
  setView: (view) => set({ view }),
  setAttended: (attended) => set({ attended }),
  firePulse: (id) =>
    set((s) => ({ pulse: { id, count: (s.pulse?.count ?? 0) + 1 } })),
  setTransition: (transition) => set({ transition }),
  saveBrainPose: (savedBrainPose) => set({ savedBrainPose }),
  announce: (announcement) => set({ announcement }),
  setGraph: (graph) => set({ graph }),
  setHoveredNodeId: (hoveredNodeId) => set({ hoveredNodeId }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
}));
