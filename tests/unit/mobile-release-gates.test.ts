import { describe, expect, it } from "vitest";
import { evaluateMobileReleaseConfig } from "../../scripts/check-mobile-release.mjs";

const hardenedManifest = `
<application
  android:allowBackup="false"
  android:usesCleartextTraffic="false">
</application>
`;

const hardenedReleaseBuild = `
release {
  minifyEnabled true
  shrinkResources true
  proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
}
`;

const dualModeCapacitorConfig = `
const bundledMobileRelease = process.env.INTELLECTX_MOBILE_BUNDLED === "true";
const remoteServerConfig = { url: "https://example.com" };
const config = {
  webDir: bundledMobileRelease ? "mobile-client/out" : "public",
  ...(bundledMobileRelease ? {} : { server: remoteServerConfig }),
};
`;

describe("mobile release configuration gate", () => {
  it("passes a bundled hardened mobile release configuration", () => {
    const report = evaluateMobileReleaseConfig({
      capacitorConfig: `const config = { webDir: "dist-mobile" };`,
      androidManifest: hardenedManifest,
      androidBuildGradle: hardenedReleaseBuild,
      bundledIndexExists: true,
    });

    expect(report.webDir).toBe("dist-mobile");
    expect(report.errors).toEqual([]);
  });

  it("distinguishes default remote delivery from explicit bundled mode", () => {
    const defaultReport = evaluateMobileReleaseConfig({
      capacitorConfig: dualModeCapacitorConfig,
      androidManifest: hardenedManifest,
      androidBuildGradle: hardenedReleaseBuild,
      bundledIndexExists: false,
      bundledMode: false,
    });
    const bundledReport = evaluateMobileReleaseConfig({
      capacitorConfig: dualModeCapacitorConfig,
      androidManifest: hardenedManifest,
      androidBuildGradle: hardenedReleaseBuild,
      bundledIndexExists: true,
      bundledMode: true,
    });

    expect(defaultReport.webDir).toBe("public");
    expect(defaultReport.errors).toContain("production Capacitor config must not contain an active remote server.url");
    expect(bundledReport.webDir).toBe("mobile-client/out");
    expect(bundledReport.errors).toEqual([]);
  });

  it("reports direct remote WebView delivery and missing bundled assets as release blockers", () => {
    const report = evaluateMobileReleaseConfig({
      capacitorConfig: `
        const config = {
          webDir: "public",
          server: { url: "https://example.com" },
        };
      `,
      androidManifest: hardenedManifest,
      androidBuildGradle: hardenedReleaseBuild,
      bundledIndexExists: false,
    });

    expect(report.errors).toContain("production Capacitor config must not contain an active remote server.url");
    expect(report.errors).toContain("bundled mobile entry point is missing at public/index.html");
  });

  it("reports Android release security and optimization regressions", () => {
    const report = evaluateMobileReleaseConfig({
      capacitorConfig: `const config = { webDir: "dist-mobile" };`,
      androidManifest: `<application android:allowBackup="true" android:usesCleartextTraffic="true" />`,
      androidBuildGradle: `release { minifyEnabled false }`,
      bundledIndexExists: true,
    });

    expect(report.errors).toEqual(
      expect.arrayContaining([
        "Android application backup must be disabled for the current mobile data model",
        "Android cleartext traffic must be disabled",
        "Android release code shrinking is not enabled",
        "Android release resource shrinking is not enabled",
        "Android release build is not using the optimized ProGuard baseline",
      ]),
    );
  });
});
