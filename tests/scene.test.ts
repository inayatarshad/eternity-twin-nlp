import { describe, expect, it } from "vitest";
import { LOBES, getLobeById, isLobeId } from "@/lib/lobes";
import { resolveTier, type DeviceCaps } from "@/lib/scene/perf";

const caps = (overrides: Partial<DeviceCaps>): DeviceCaps => ({
  webgl2: true,
  coarsePointer: false,
  viewportWidth: 1440,
  ...overrides,
});

describe("lobe definitions (docs/ui/02)", () => {
  it("defines exactly the six cognitive lobes", () => {
    expect(LOBES.map((l) => l.id).sort()).toEqual(
      ["core", "frontal", "limbic", "occipital", "parietal", "temporal"],
    );
  });

  it("gives every lobe a unique accent color", () => {
    const colors = new Set(LOBES.map((l) => l.color));
    expect(colors.size).toBe(LOBES.length);
  });

  it("validates route slugs", () => {
    expect(isLobeId("limbic")).toBe(true);
    expect(isLobeId("amygdala")).toBe(false);
    expect(isLobeId("")).toBe(false);
    expect(getLobeById("frontal")?.displayName).toContain("Reasoning");
    expect(getLobeById("nope")).toBeUndefined();
  });
});

describe("perf tier resolution (docs/ui/09)", () => {
  it("honors a user override over detection", () => {
    expect(resolveTier("low", caps({}))).toBe("low");
    expect(resolveTier("fallback2d", caps({}))).toBe("fallback2d");
  });

  it("falls back to 2D without WebGL2 even if override is auto", () => {
    expect(resolveTier("auto", caps({ webgl2: false }))).toBe("fallback2d");
  });

  it("sends phones to the 2D mode by default (decision P5)", () => {
    expect(
      resolveTier("auto", caps({ coarsePointer: true, viewportWidth: 390 })),
    ).toBe("fallback2d");
  });

  it("gives tablets the medium tier", () => {
    expect(
      resolveTier("auto", caps({ coarsePointer: true, viewportWidth: 1024 })),
    ).toBe("medium");
  });

  it("detects software rasterizers as low tier", () => {
    expect(
      resolveTier("auto", caps({ rendererString: "Google SwiftShader" })),
    ).toBe("low");
  });

  it("downgrades low-memory devices to medium", () => {
    expect(resolveTier("auto", caps({ deviceMemoryGb: 4 }))).toBe("medium");
  });

  it("defaults to high on capable desktops", () => {
    expect(resolveTier("auto", caps({ deviceMemoryGb: 16 }))).toBe("high");
  });
});
