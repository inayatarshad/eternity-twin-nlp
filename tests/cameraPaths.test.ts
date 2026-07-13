import { describe, expect, it } from "vitest";
import { LOBES } from "@/lib/lobes";
import {
  BRAIN_POSE,
  ENTER_MS,
  EXIT_MS,
  easeInOutCubic,
  enterControlPoint,
  interiorPose,
  lerp3,
  quadBezier,
} from "@/lib/scene/cameraPaths";

describe("transition timing contract (docs/ui/05 & roadmap Phase 4)", () => {
  it("enter completes within the 900 ms ceiling", () => {
    expect(ENTER_MS).toBeLessThanOrEqual(900);
  });
  it("exit completes within the 700 ms ceiling", () => {
    expect(EXIT_MS).toBeLessThanOrEqual(700);
  });
});

describe("easing", () => {
  it("anchors at 0 and 1 and is monotonic", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    let prev = 0;
    for (let t = 0; t <= 1.001; t += 0.05) {
      const v = easeInOutCubic(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
  it("clamps out-of-range inputs", () => {
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });
});

describe("camera paths", () => {
  it("bezier hits both endpoints exactly", () => {
    const a: [number, number, number] = [0, 0.6, 5];
    const c: [number, number, number] = [0, 0.4, 1.3];
    const b: [number, number, number] = [0, 0.28, 0.92];
    expect(quadBezier(a, c, b, 0)).toEqual(a);
    expect(quadBezier(a, c, b, 1)).toEqual(b);
  });

  it("lerp3 hits both endpoints", () => {
    expect(lerp3([1, 2, 3], [4, 5, 6], 0)).toEqual([1, 2, 3]);
    expect(lerp3([1, 2, 3], [4, 5, 6], 1)).toEqual([4, 5, 6]);
  });

  it("gives every lobe a finite interior pose distinct from its target", () => {
    for (const lobe of LOBES) {
      const pose = interiorPose(lobe);
      for (const n of [...pose.position, ...pose.target]) {
        expect(Number.isFinite(n)).toBe(true);
      }
      expect(pose.position).not.toEqual(pose.target);
    }
  });

  it("handles the origin-centered core without degenerate directions", () => {
    const core = LOBES.find((l) => l.id === "core")!;
    const pose = interiorPose(core);
    expect(pose.target[2]).toBeLessThan(pose.position[2]); // looks forward
    const ctrl = enterControlPoint(core);
    expect(ctrl[2]).toBeGreaterThan(core.position[2]); // approach from outside
  });

  it("keeps the default brain pose outside the orbit minimum distance", () => {
    const [x, y, z] = BRAIN_POSE.position;
    expect(Math.hypot(x, y, z)).toBeGreaterThan(3.4);
  });
});
