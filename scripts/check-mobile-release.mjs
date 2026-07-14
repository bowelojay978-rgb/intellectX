import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

function hasPattern(source, pattern) {
  return pattern.test(source);
}

function readWebDir(capacitorConfig) {
  return capacitorConfig.match(/\bwebDir\s*:\s*["']([^"']+)["']/)?.[1] ?? null;
}

export function evaluateMobileReleaseConfig({
  capacitorConfig,
  androidManifest,
  androidBuildGradle,
  bundledIndexExists,
}) {
  const errors = [];
  const webDir = readWebDir(capacitorConfig);

  if (hasPattern(capacitorConfig, /\bserver\s*:\s*\{[\s\S]*?\burl\s*:\s*["']https?:\/\//)) {
    errors.push("production Capacitor config must not contain a remote server.url");
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
    errors,
  };
}

export function inspectCurrentMobileReleaseConfig(rootDir = process.cwd()) {
  const capacitorConfig = readFileSync(path.join(rootDir, "capacitor.config.ts"), "utf8");
  const androidManifest = readFileSync(path.join(rootDir, "android/app/src/main/AndroidManifest.xml"), "utf8");
  const androidBuildGradle = readFileSync(path.join(rootDir, "android/app/build.gradle"), "utf8");
  const webDir = readWebDir(capacitorConfig);
  const bundledIndexExists = Boolean(webDir && existsSync(path.join(rootDir, webDir, "index.html")));

  return evaluateMobileReleaseConfig({
    capacitorConfig,
    androidManifest,
    androidBuildGradle,
    bundledIndexExists,
  });
}

export function printMobileReleaseReport(report) {
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
  const report = inspectCurrentMobileReleaseConfig();

  printMobileReleaseReport(report);

  if (strict && report.errors.length > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
