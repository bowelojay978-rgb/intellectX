import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type OklchColor = {
  l: number;
  c: number;
  h: number;
};

function getRootThemeBlock(css: string) {
  const match = css.match(/:root\s*\{([\s\S]*?)\n\}/);
  if (!match) throw new Error("Could not find :root theme block in globals.css");
  return match[1];
}

function readOklchToken(block: string, token: string): OklchColor {
  const match = block.match(new RegExp(`--${token}:\\s*oklch\\(([^)]+)\\)`));
  if (!match) throw new Error(`Could not find OKLCH token --${token}`);

  const [l, c, h] = match[1].trim().split(/\s+/).slice(0, 3).map(Number);
  if (![l, c, h].every(Number.isFinite)) {
    throw new Error(`Invalid OKLCH token --${token}: ${match[1]}`);
  }

  return { l, c, h };
}

function oklchToRelativeLuminance({ l, c, h }: OklchColor) {
  const hue = (h * Math.PI) / 180;
  const a = c * Math.cos(hue);
  const b = c * Math.sin(hue);

  const lPrime = l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = l - 0.0894841775 * a - 1.291485548 * b;

  const lLinear = lPrime ** 3;
  const mLinear = mPrime ** 3;
  const sLinear = sPrime ** 3;

  const red = 4.0767416621 * lLinear - 3.3077115913 * mLinear + 0.2309699292 * sLinear;
  const green = -1.2684380046 * lLinear + 2.6097574011 * mLinear - 0.3413193965 * sLinear;
  const blue = -0.0041960863 * lLinear - 0.7034186147 * mLinear + 1.707614701 * sLinear;

  const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
  return 0.2126 * clamp(red) + 0.7152 * clamp(green) + 0.0722 * clamp(blue);
}

function contrastRatio(first: OklchColor, second: OklchColor) {
  const firstLuminance = oklchToRelativeLuminance(first);
  const secondLuminance = oklchToRelativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

const globalsCss = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
const rootTheme = getRootThemeBlock(globalsCss);
const background = readOklchToken(rootTheme, "background");
const card = readOklchToken(rootTheme, "card");

describe("frontend accessibility theme tokens", () => {
  it("keeps muted foreground text at WCAG AA contrast on light surfaces", () => {
    const mutedForeground = readOklchToken(rootTheme, "muted-foreground");

    expect(contrastRatio(mutedForeground, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(mutedForeground, card)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps success text at WCAG AA contrast on light surfaces", () => {
    const success = readOklchToken(rootTheme, "success");

    expect(contrastRatio(success, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(success, card)).toBeGreaterThanOrEqual(4.5);
  });
});
