"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getLobeById, type LobeId } from "@/lib/lobes";
import { useSceneStore, type BrainView } from "@/lib/state/scene";
import {
  BASE_FOV,
  BRAIN_POSE,
  ENTER_FOV_BUMP,
  ENTER_MS,
  EXIT_FOV_BUMP,
  EXIT_MS,
  easeInOutCubic,
  enterControlPoint,
  interiorPose,
  lerp3,
  quadBezier,
} from "@/lib/scene/cameraPaths";
import { WarpStreaks } from "@/components/scene/WarpStreaks";

type V3 = [number, number, number];

interface ControlsLike {
  target: THREE.Vector3;
  enabled: boolean;
  update: () => void;
}

interface Anim {
  kind: "enter" | "exit";
  lobeId: LobeId;
  elapsed: number;
  dur: number;
  fromPos: V3;
  ctrl: V3;
  toPos: V3;
  fromTarget: V3;
  toTarget: V3;
  fovBump: number;
}

/**
 * Sole owner of camera choreography (docs/ui/06). Reacts to URL-derived view
 * changes — which makes browser back/forward mirror the transitions for free.
 * Enter ≤850 ms, exit ≤700 ms, any input skips, reduced motion snaps
 * (the layout provides the crossfade veil), arrivals are announced.
 */
export function TransitionDirector({ reducedMotion }: { reducedMotion: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as ControlsLike | null;

  const view = useSceneStore((s) => s.view);
  const transition = useSceneStore((s) => s.transition);
  const setTransition = useSceneStore((s) => s.setTransition);
  const saveBrainPose = useSceneStore((s) => s.saveBrainPose);
  const announce = useSceneStore((s) => s.announce);

  const anim = useRef<Anim | null>(null);
  const progressRef = useRef(0);
  const prevView = useRef<BrainView | null>(null);
  const controlsRef = useRef<ControlsLike | null>(null);

  // OrbitControls registers after first mount; adopt it and sync its
  // enabled/target state to the current view (unless a flight is running).
  useEffect(() => {
    controlsRef.current = controls;
    if (controls && !anim.current) {
      const target = useSceneStore.getState().view;
      controls.enabled = true;
      if (target !== "brain") {
        const pose = interiorPose(getLobeById(target)!);
        controls.target.set(...pose.target);
        controls.update();
      }
    }
  }, [controls]);

  const snapTo = (target: BrainView) => {
    const pose =
      target === "brain"
        ? (useSceneStore.getState().savedBrainPose ?? BRAIN_POSE)
        : interiorPose(getLobeById(target)!);
    camera.position.set(...pose.position);
    camera.fov = BASE_FOV;
    camera.updateProjectionMatrix();
    const c = controlsRef.current;
    if (c) {
      c.target.set(...pose.target);
      c.enabled = true;
      c.update();
    } else {
      camera.lookAt(...pose.target);
    }
  };

  // react to view changes (gesture, breadcrumb, Esc, browser back/forward)
  useEffect(() => {
    const prev = prevView.current;
    prevView.current = view;

    if (prev === null || prev === view) {
      // cold mount (deep link) — non-cinematic placement (docs/ui/01)
      snapTo(view);
      return;
    }

    const entering = view !== "brain";
    const lobeId = (entering ? view : prev) as LobeId;
    const lobe = getLobeById(lobeId);
    if (!lobe || (entering && prev !== "brain")) {
      snapTo(view); // lobe→lobe or unknown: plain cut
      return;
    }

    if (entering) {
      // remember where the user left the orbit (docs/ui/01 return flows)
      const c = controlsRef.current;
      saveBrainPose({
        position: camera.position.toArray() as V3,
        target: c ? (c.target.toArray() as V3) : [0, 0, 0],
      });
    }

    if (reducedMotion) {
      snapTo(view);
      announce(
        entering
          ? `Entered ${lobe.displayName}.`
          : "Returned to brain overview.",
      );
      return;
    }

    const c = controlsRef.current;
    if (c) c.enabled = false;
    const fromTarget: V3 = c
      ? (c.target.toArray() as V3)
      : (camera.position.toArray() as V3);
    const toPose = entering
      ? interiorPose(lobe)
      : (useSceneStore.getState().savedBrainPose ?? BRAIN_POSE);
    anim.current = {
      kind: entering ? "enter" : "exit",
      lobeId,
      elapsed: 0,
      dur: entering ? ENTER_MS : EXIT_MS,
      fromPos: camera.position.toArray() as V3,
      ctrl: enterControlPoint(lobe),
      toPos: toPose.position,
      fromTarget,
      toTarget: toPose.target,
      fovBump: entering ? ENTER_FOV_BUMP : EXIT_FOV_BUMP,
    };
    progressRef.current = 0;
    setTransition({ kind: anim.current.kind, lobeId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // any input skips the flight (docs/ui/05: never trap the user)
  useEffect(() => {
    if (!transition) return;
    const skip = () => {
      if (anim.current) anim.current.elapsed = anim.current.dur;
    };
    window.addEventListener("pointerdown", skip, true);
    window.addEventListener("wheel", skip, true);
    window.addEventListener("keydown", skip, true);
    return () => {
      window.removeEventListener("pointerdown", skip, true);
      window.removeEventListener("wheel", skip, true);
      window.removeEventListener("keydown", skip, true);
    };
  }, [transition]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a) return;
    a.elapsed = Math.min(a.dur, a.elapsed + delta * 1000);
    const t = a.elapsed / a.dur;
    const e = easeInOutCubic(t);
    progressRef.current = t;

    const pos = quadBezier(a.fromPos, a.ctrl, a.toPos, e);
    camera.position.set(...pos);
    camera.lookAt(...lerp3(a.fromTarget, a.toTarget, e));
    camera.fov = BASE_FOV + a.fovBump * Math.sin(Math.PI * e);
    camera.updateProjectionMatrix();

    if (t >= 1) {
      camera.fov = BASE_FOV;
      camera.updateProjectionMatrix();
      const c = controlsRef.current;
      if (c) {
        c.target.set(...a.toTarget);
        c.enabled = true; // interior orbit around the constellation (Phase 5)
        c.update();
      }
      const lobe = getLobeById(a.lobeId)!;
      announce(
        a.kind === "enter"
          ? `Entered ${lobe.displayName}.`
          : "Returned to brain overview.",
      );
      anim.current = null;
      setTransition(null);
    }
  });

  if (!transition) return null;
  const lobe = getLobeById(transition.lobeId)!;
  return (
    <WarpStreaks
      progressRef={progressRef}
      color={lobe.color}
      kind={transition.kind}
    />
  );
}
