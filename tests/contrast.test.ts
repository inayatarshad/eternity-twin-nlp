import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { colorTokens, lightColorTokens } from "@/lib/tokens/colors";
import { contrastRatio } from "@/lib/tokens/contrast";

const SURFACES = ["space-950", "space-900", "space-800"] as const;
const TEXT = ["text-primary", "text-secondary", "text-muted"] as const;
const GLYPHS = ["positive", "warning", "danger"] as const;

describe("WCAG contrast contract (docs/ui/04)", () => {
  for (const text of TEXT) {
    for (const surface of SURFACES) {
      it(`${text} on ${surface} ≥ 4.5:1`, () => {
        const ratio = contrastRatio(colorTokens[text], colorTokens[surface]);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  for (const glyph of GLYPHS) {
    it(`${glyph} (UI glyph) on space-950 ≥ 3:1`, () => {
      const ratio = contrastRatio(colorTokens[glyph], colorTokens["space-950"]);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  }
});

describe("WCAG contrast contract — light theme", () => {
  for (const text of TEXT) {
    for (const surface of ["space-950", "space-800"] as const) {
      it(`light ${text} on light ${surface} ≥ 4.5:1`, () => {
        const ratio = contrastRatio(
          lightColorTokens[text],
          lightColorTokens[surface],
        );
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe("CSS ↔ TS token sync (light overrides)", () => {
  const css = readFileSync(
    join(__dirname, "..", "styles", "globals.css"),
    "utf8",
  );
  for (const [name, hex] of Object.entries(lightColorTokens)) {
    it(`globals.css light theme defines ${name} as ${hex}`, () => {
      const pattern = new RegExp(`--color-${name}:\\s*${hex}\\s*;`, "i");
      expect(css).toMatch(pattern);
    });
  }
});

describe("CSS ↔ TS token sync", () => {
  const css = readFileSync(
    join(__dirname, "..", "styles", "globals.css"),
    "utf8",
  );

  for (const [name, hex] of Object.entries(colorTokens)) {
    it(`globals.css defines ${name} as ${hex}`, () => {
      const pattern = new RegExp(
        `--color-${name}:\\s*${hex.replace("#", "#?")}\\s*;`,
        "i",
      );
      expect(css).toMatch(pattern);
    });
  }
});
