"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Moon, Settings2, Sun } from "lucide-react";
import { LoadingExperience } from "@/components/chrome/LoadingExperience";
import { Fallback2D } from "@/components/chrome/Fallback2D";
import { LobeProxyList } from "@/components/chrome/LobeProxyList";
import { BrainScene } from "@/components/scene/BrainScene";
import { TransitionDirector } from "@/components/scene/TransitionDirector";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import {
  useEffectiveReducedMotion,
  useEffectiveTheme,
} from "@/components/ClientPreferences";
import { useAnimationStore } from "@/lib/state/animation";
import { isLobeId, type LobeId } from "@/lib/lobes";
import { useSceneStore, type BrainView } from "@/lib/state/scene";
import { useLobeGraph } from "@/lib/data/useLobeGraph";

// The scene must never render on the server (three touches window/document).
const SceneRoot = dynamic(
  () => import("@/components/scene/SceneRoot").then((m) => m.SceneRoot),
  { ssr: false },
);

function parsePathname(pathname: string): {
  view: BrainView;
  nodeId: string | null;
} {
  const segments = pathname.replace(/^\/brain\/?/, "").split("/");
  const lobeSegment = segments[0] ?? "";
  const view: BrainView = isLobeId(lobeSegment) ? lobeSegment : "brain";
  const nodeId =
    view !== "brain" && segments[1] === "node" && segments[2]
      ? decodeURIComponent(segments[2])
      : null;
  return { view, nodeId };
}

/**
 * Persistent scene shell for /brain and /brain/[lobe] (Phase 4): the Canvas
 * lives here and survives route changes, so the TransitionDirector can fly
 * the camera across them. Route content renders as DOM overlays above it.
 */
export default function BrainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const reducedMotion = useEffectiveReducedMotion();
  const theme = useEffectiveTheme();
  const setThemePreference = useAnimationStore((s) => s.setThemePreference);
  const [ready, setReady] = useState(false);

  const { view, nodeId } = parsePathname(pathname);
  const setView = useSceneStore((s) => s.setView);
  const setSelectedNodeId = useSceneStore((s) => s.setSelectedNodeId);
  const setGraph = useSceneStore((s) => s.setGraph);
  const setAttended = useSceneStore((s) => s.setAttended);
  const firePulse = useSceneStore((s) => s.firePulse);
  const announcement = useSceneStore((s) => s.announcement);
  const navigating = useRef(false);

  useEffect(() => {
    setView(view);
    setSelectedNodeId(nodeId);
    navigating.current = false; // a settled view unlocks the next activation
  }, [view, nodeId, setView, setSelectedNodeId]);

  // fetch + layout the lobe graph (session-cached), publish to the scene store
  const { data: lobeGraph } = useLobeGraph(view !== "brain" ? view : null);
  useEffect(() => {
    setGraph(lobeGraph ?? null);
  }, [lobeGraph, setGraph]);

  const handleActivate = useCallback(
    (id: LobeId) => {
      if (navigating.current || view !== "brain") return;
      navigating.current = true;
      firePulse(id);
      // route pushes at gesture time; the director masks the load (docs/ui/03)
      router.push(`/brain/${id}`);
    },
    [view, firePulse, router],
  );

  const handleSelectNode = useCallback(
    (selected: string) => {
      if (view === "brain") return;
      router.push(`/brain/${view}/node/${encodeURIComponent(selected)}`);
    },
    [view, router],
  );

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <SceneRoot
        ariaLabel="A luminous translucent brain floating in space. Six glowing regions: Frontal reasoning, Limbic emotion, Temporal memory, Parietal association, Occipital perception, and the golden Core identity at its center."
        fallback={view === "brain" ? <Fallback2D /> : null}
        onFirstFrame={() => setReady(true)}
      >
        {({ tier, reducedMotion: rm, theme: sceneTheme }) => (
          <>
            <BrainScene
              tier={tier}
              reducedMotion={rm}
              theme={sceneTheme}
              onActivate={handleActivate}
              onSelectNode={handleSelectNode}
            />
            <TransitionDirector reducedMotion={rm} />
          </>
        )}
      </SceneRoot>

      <LoadingExperience ready={ready} />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-(--z-chrome) flex items-start justify-between p-5">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Eternity Twin
        </Link>
        <div className="pointer-events-auto flex items-center gap-4">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-1.5 rounded-pill border border-consciousness-gold/50 bg-consciousness-gold/10 px-3 py-1 text-sm text-text-primary transition-colors duration-(--dur-instant) hover:border-consciousness-gold"
          >
            <BookOpen aria-hidden="true" className="h-4 w-4" />
            How it works
          </Link>
          <button
            type="button"
            aria-label={
              theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
            }
            onClick={() =>
              setThemePreference(theme === "dark" ? "light" : "dark")
            }
            className="inline-flex items-center text-text-secondary hover:text-text-primary"
          >
            {theme === "dark" ? (
              <Sun aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Moon aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
          >
            <Settings2 aria-hidden="true" className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </header>

      {view === "brain" ? (
        <div className="absolute z-(--z-chrome)">
          <LobeProxyList onAttend={setAttended} onActivate={handleActivate} />
        </div>
      ) : null}

      <VisuallyHidden>
        <p role="status">{announcement}</p>
      </VisuallyHidden>

      {/* reduced-motion crossfade: replays on every view change (docs/ui/05) */}
      {reducedMotion && ready ? (
        <div
          key={view}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-(--z-overlay) bg-space-950"
          style={{ animation: "rm-crossfade 300ms ease-out forwards" }}
        />
      ) : null}
      <style>{`
        @keyframes rm-crossfade {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>

      {children}
    </main>
  );
}
