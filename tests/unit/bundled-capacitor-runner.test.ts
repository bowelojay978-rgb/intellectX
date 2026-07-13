import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertBundledMobileOutput,
  resolveBundledCapacitorCommand,
} from "../../scripts/run-bundled-capacitor.mjs";

describe("bundled Capacitor runner", () => {
  it("allows only Android copy and sync operations", () => {
    expect(resolveBundledCapacitorCommand(["copy", "android"])).toEqual({
      operation: "copy",
      platform: "android",
    });
    expect(resolveBundledCapacitorCommand(["sync", "android"])).toEqual({
      operation: "sync",
      platform: "android",
    });

    expect(() => resolveBundledCapacitorCommand(["run", "android"])).toThrow(
      "Unsupported Capacitor operation: run",
    );
    expect(() => resolveBundledCapacitorCommand(["sync", "ios"])).toThrow(
      "Unsupported bundled mobile platform: ios",
    );
  });

  it("fails before native copy or sync when the mobile bundle has not been built", () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), "intellectx-mobile-missing-"));

    expect(() => assertBundledMobileOutput(rootDir)).toThrow(
      "Bundled mobile output is missing. Run npm run build:mobile before Capacitor copy/sync.",
    );
  });

  it("accepts a generated bundled mobile index entry point", () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), "intellectx-mobile-ready-"));
    const outputDir = path.join(rootDir, "mobile-client", "out");
    mkdirSync(outputDir, { recursive: true });
    const indexPath = path.join(outputDir, "index.html");
    writeFileSync(indexPath, "<html></html>", "utf8");

    expect(assertBundledMobileOutput(rootDir)).toBe(indexPath);
  });
});
