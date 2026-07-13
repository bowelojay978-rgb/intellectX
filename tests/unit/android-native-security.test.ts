import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readRepositoryFile(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Android native security configuration", () => {
  it("does not expose the unused broad FileProvider surface", () => {
    const manifest = readRepositoryFile("android/app/src/main/AndroidManifest.xml");

    expect(manifest).not.toContain("androidx.core.content.FileProvider");
    expect(manifest).not.toContain("android.support.FILE_PROVIDER_PATHS");
  });

  it("disables WebView file and content access explicitly", () => {
    const mainActivity = readRepositoryFile(
      "android/app/src/main/java/com/intellectx/app/MainActivity.java",
    );

    expect(mainActivity).toContain("settings.setAllowFileAccess(false)");
    expect(mainActivity).toContain("settings.setAllowContentAccess(false)");
    expect(mainActivity).toContain("settings.setAllowFileAccessFromFileURLs(false)");
    expect(mainActivity).toContain("settings.setAllowUniversalAccessFromFileURLs(false)");
  });
});
