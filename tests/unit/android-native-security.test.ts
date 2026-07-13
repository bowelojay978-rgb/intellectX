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

  it("excludes app data from Android cloud backup and device transfer", () => {
    const manifest = readRepositoryFile("android/app/src/main/AndroidManifest.xml");
    const legacyRules = readRepositoryFile("android/app/src/main/res/xml/backup_rules.xml");
    const extractionRules = readRepositoryFile(
      "android/app/src/main/res/xml/data_extraction_rules.xml",
    );

    expect(manifest).toContain('android:allowBackup="false"');
    expect(manifest).toContain('android:fullBackupContent="@xml/backup_rules"');
    expect(manifest).toContain('android:dataExtractionRules="@xml/data_extraction_rules"');

    for (const domain of [
      "root",
      "file",
      "database",
      "sharedpref",
      "external",
      "device_root",
      "device_file",
      "device_database",
      "device_sharedpref",
    ]) {
      const exclusion = `<exclude domain="${domain}" path="." />`;
      expect(legacyRules).toContain(exclusion);
      expect(extractionRules).toContain(exclusion);
    }

    expect(extractionRules).toContain("<cloud-backup>");
    expect(extractionRules).toContain("<device-transfer>");
  });

  it("enforces HTTPS-only transport and production-safe WebView defaults", () => {
    const manifest = readRepositoryFile("android/app/src/main/AndroidManifest.xml");
    const capacitorConfig = readRepositoryFile("capacitor.config.ts");

    expect(manifest).toContain('android:usesCleartextTraffic="false"');
    expect(capacitorConfig).toContain("cleartext: false");
    expect(capacitorConfig).toContain("allowMixedContent: false");
    expect(capacitorConfig).toContain("webContentsDebuggingEnabled: false");
    expect(capacitorConfig).toContain('loggingBehavior: "debug"');
    expect(capacitorConfig).not.toContain("allowMixedContent: true");
    expect(capacitorConfig).not.toContain("webContentsDebuggingEnabled: true");
  });

  it("resizes the activity when the soft keyboard opens", () => {
    const manifest = readRepositoryFile("android/app/src/main/AndroidManifest.xml");

    expect(manifest).toContain('android:windowSoftInputMode="adjustResize"');
  });

  it("uses WebView history for Android back navigation before exiting", () => {
    const mainActivity = readRepositoryFile(
      "android/app/src/main/java/com/intellectx/app/MainActivity.java",
    );

    expect(mainActivity).toContain("getOnBackPressedDispatcher().addCallback");
    expect(mainActivity).toContain("bridge.getWebView().canGoBack()");
    expect(mainActivity).toContain("bridge.getWebView().goBack()");
    expect(mainActivity).toContain("setEnabled(false)");
    expect(mainActivity).toContain("getOnBackPressedDispatcher().onBackPressed()");
  });

  it("enables release-only Android code and resource optimization", () => {
    const appBuildGradle = readRepositoryFile("android/app/build.gradle");

    expect(appBuildGradle).toContain("release {");
    expect(appBuildGradle).toContain("minifyEnabled true");
    expect(appBuildGradle).toContain("shrinkResources true");
    expect(appBuildGradle).toContain("getDefaultProguardFile('proguard-android-optimize.txt')");
  });

  it("supports explicit store version overrides without hardcoding release increments", () => {
    const appBuildGradle = readRepositoryFile("android/app/build.gradle");

    expect(appBuildGradle).toContain("project.findProperty('APP_VERSION_CODE')");
    expect(appBuildGradle).toContain("project.findProperty('APP_VERSION_NAME')");
    expect(appBuildGradle).toContain("versionCode appVersionCode");
    expect(appBuildGradle).toContain("versionName appVersionName");
  });

  it("defines every custom Android theme color referenced by app styles", () => {
    const styles = readRepositoryFile("android/app/src/main/res/values/styles.xml");
    const colors = readRepositoryFile("android/app/src/main/res/values/colors.xml");

    for (const colorName of ["colorPrimary", "colorPrimaryDark", "colorAccent"]) {
      expect(styles).toContain(`@color/${colorName}`);
      expect(colors).toContain(`<color name="${colorName}">`);
    }
  });
});
