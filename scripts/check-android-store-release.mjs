import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const SIGNING_ENV_NAMES = [
  "ANDROID_KEYSTORE_PATH",
  "ANDROID_KEYSTORE_PASSWORD",
  "ANDROID_KEY_ALIAS",
  "ANDROID_KEY_PASSWORD",
];

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function readQuotedSetting(source, name) {
  return source.match(new RegExp(`\\b${name}\\s*:\\s*["']([^"']+)["']`))?.[1] ?? null;
}

function readGradleStringSetting(source, name) {
  return source.match(new RegExp(`\\b${name}\\s+["']([^"']+)["']`))?.[1] ?? null;
}

function readAndroidString(source, name) {
  return source.match(new RegExp(`<string\\s+name=["']${name}["']>([^<]+)</string>`))?.[1]?.trim() ?? null;
}

function isRemoteServerUrlConfigured(capacitorConfig) {
  return /\bserver\s*:\s*\{[\s\S]*?\burl\s*:\s*["']https?:\/\//.test(capacitorConfig);
}

function readWebDir(capacitorConfig) {
  return readQuotedSetting(capacitorConfig, "webDir");
}

export function evaluateAndroidStoreRelease({
  env,
  capacitorConfig,
  androidBuildGradle,
  androidStrings,
  bundledEntryExists,
  keystoreExists,
}) {
  const errors = [];

  for (const name of SIGNING_ENV_NAMES) {
    if (!hasValue(env[name])) {
      errors.push(`missing ${name}`);
    }
  }

  if (!hasValue(env.APP_VERSION_CODE) || !/^\d+$/.test(env.APP_VERSION_CODE.trim())) {
    errors.push("APP_VERSION_CODE must be supplied as a positive integer");
  } else if (Number(env.APP_VERSION_CODE) < 1) {
    errors.push("APP_VERSION_CODE must be at least 1");
  }

  if (!hasValue(env.APP_VERSION_NAME)) {
    errors.push("missing APP_VERSION_NAME");
  }

  if (hasValue(env.ANDROID_KEYSTORE_PATH) && !keystoreExists) {
    errors.push("ANDROID_KEYSTORE_PATH does not point to an existing keystore file");
  }

  const capacitorAppId = readQuotedSetting(capacitorConfig, "appId");
  const applicationId = readGradleStringSetting(androidBuildGradle, "applicationId");
  const packageName = readAndroidString(androidStrings, "package_name");
  const packageIds = [capacitorAppId, applicationId, packageName].filter(Boolean);

  if (packageIds.length !== 3 || new Set(packageIds).size !== 1) {
    errors.push("Capacitor appId, Android applicationId, and package_name must match exactly");
  }

  const webDir = readWebDir(capacitorConfig);

  if (webDir !== "mobile-client/out") {
    errors.push('production Capacitor webDir must be "mobile-client/out"');
  }

  if (!bundledEntryExists) {
    errors.push("validated bundled mobile index.html is missing");
  }

  if (isRemoteServerUrlConfigured(capacitorConfig)) {
    errors.push("production Capacitor config must not contain a remote server.url");
  }

  for (const name of SIGNING_ENV_NAMES) {
    if (!androidBuildGradle.includes(`System.getenv('${name}')`)) {
      errors.push(`Android Gradle signing config must read ${name} from the environment`);
    }
  }

  if (!androidBuildGradle.includes("signingConfig signingConfigs.release")) {
    errors.push("Android release build is not wired to the release signing configuration");
  }

  return {
    errors: [...new Set(errors)],
    packageId: packageIds.length === 3 && new Set(packageIds).size === 1 ? packageIds[0] : null,
    webDir,
  };
}

export function inspectCurrentAndroidStoreRelease(rootDir = process.cwd(), env = process.env) {
  const capacitorConfig = readFileSync(path.join(rootDir, "capacitor.config.ts"), "utf8");
  const androidBuildGradle = readFileSync(path.join(rootDir, "android/app/build.gradle"), "utf8");
  const androidStrings = readFileSync(path.join(rootDir, "android/app/src/main/res/values/strings.xml"), "utf8");
  const webDir = readWebDir(capacitorConfig);
  const bundledEntryExists = Boolean(webDir && existsSync(path.join(rootDir, webDir, "index.html")));

  const keystorePath = hasValue(env.ANDROID_KEYSTORE_PATH)
    ? path.isAbsolute(env.ANDROID_KEYSTORE_PATH)
      ? env.ANDROID_KEYSTORE_PATH
      : path.join(rootDir, env.ANDROID_KEYSTORE_PATH)
    : null;

  return evaluateAndroidStoreRelease({
    env,
    capacitorConfig,
    androidBuildGradle,
    androidStrings,
    bundledEntryExists,
    keystoreExists: Boolean(keystorePath && existsSync(keystorePath)),
  });
}

export function printAndroidStoreReleaseReport(report) {
  console.log(`Android package ID: ${report.packageId ?? "mismatch or missing"}`);
  console.log(`Capacitor webDir: ${report.webDir ?? "missing"}`);

  if (report.errors.length === 0) {
    console.log("Android store-release gate: passed");
    return;
  }

  console.error("Android store-release gate: blocked");
  for (const error of report.errors) {
    console.error(`- ${error}`);
  }
}

function main() {
  const report = inspectCurrentAndroidStoreRelease();
  printAndroidStoreReleaseReport(report);

  if (report.errors.length > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
