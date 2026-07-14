import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

function readWebDir(capacitorConfig, bundledMode) {
  const conditionalMatch = capacitorConfig.match(
    /\bwebDir\s*:\s*bundledMobileRelease\s*\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']/,
  );

  if (conditionalMatch) {
    return bundledMode ? conditionalMatch[1] : conditionalMatch[2];
  }

  return capacitorConfig.match(/\bwebDir\s*:\s*["']([^"']+)["']/)?.[1] ?? null;
}

function hasActiveRemoteServerUrl(capacitorConfig, bundledMode) {
  const containsRemoteUrl = /\burl\s*:\s*["']https?:\/\//.test(capacitorConfig);

  if (!containsRemoteUrl) {
    return false;
  }

  const serverIsDisabledForBundledMode = capacitorConfig.includes(
    "...(bundledMobileRelease ? {} : { server: remoteServerConfig })",
  );

  return !(bundledMode && serverIsDisabledForBundledMode);
}

export function evaluateMobileReleaseConfig({
  capacitorConfig,
  androidManifest,
  androidBuildGradle,
  bundledIndexExists,
  bundledMode = false,
}) {
  const errors = [];
  const webDir = readWebDir(capacitorConfig, bundledMode);

  if (hasActiveRemoteServerUrl(capacitorConfig, bundledMode)) {
    errors.push("production Capacitor config must not contain an active remote server.url");
  }

  if (!webDir) {
    errors.push("Capacitor webDir is not configured");
  } else if (!bundledIndexExists) {
    errors.push(`bundled mobile entry point is missing at ${webDir}/index.html`);
  }

  if (!androidManifest.includes('android:allowBackup="false"')) {
    errors.push("Android application backup must be disabled for the current mobile data model");
  }

  if (!androidManifest.includes('android:usesCleartextTraffic="false"')) {
    errors.push("Android cleartext traffic must be disabled");
  }

  if (!androidBuildGradle.includes("minifyEnabled true")) {
    errors.push("Android release code shrinking is not enabled");
  }

  if (!androidBuildGradle.includes("shrinkResources true")) {
    errors.push("Android release resource shrinking is not enabled");
  }

  if (!androidBuildGradle.includes("proguard-android-optimize.txt")) {
    errors.push("Android release build is not using the optimized ProGuard baseline");
  }

  return {
    webDir,
    bundledMode,
    errors,
  };
}

export function inspectCurrentMobileReleaseConfig(rootDir = process.cwd(), { bundledMode = false } = {}) {
  const capacitorConfig = readFileSync(path.join(rootDir, "capacitor.config.ts"), "utf8");
  const androidManifest = readFileSync(path.join(rootDir, "android/app/src/main/AndroidManifest.xml"), "utf8");
  const androidBuildGradle = readFileSync(path.join(rootDir, "android/app/build.gradle"), "utf8");
  const webDir = readWebDir(capacitorConfig, bundledMode);
  const bundledIndexExists = Boolean(webDir && existsSync(path.join(rootDir, webDir, "index.html")));

  return evaluateMobileReleaseConfig({
    capacitorConfig,
    androidManifest,
    androidBuildGradle,
    bundledIndexExists,
    bundledMode,
  });
}

export function printMobileReleaseReport(report) {
  console.log(`Mobile delivery mode: ${report.bundledMode ? "bundled" : "default"}`);
  console.log(`Mobile webDir: ${report.webDir ?? "missing"}`);

  if (report.errors.length === 0) {
    console.log("Mobile release configuration gate: passed");
    return;
  }

  console.warn("Mobile release configuration gate: blocked");
  for (const error of report.errors) {
    console.warn(`- ${error}`);
  }
}

function main() {
  const args = new Set(process.argv.slice(2));
  const strict = args.has("--strict");
  const bundledMode = args.has("--bundled");
  const report = inspectCurrentMobileReleaseConfig(process.cwd(), { bundledMode });

  printMobileReleaseReport(report);

  if (strict && report.errors.length > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
