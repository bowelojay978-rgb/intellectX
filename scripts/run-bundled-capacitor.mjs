import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const ALLOWED_OPERATIONS = new Set(["copy", "sync"]);
const ALLOWED_PLATFORMS = new Set(["android"]);

export function resolveBundledCapacitorCommand(args) {
  const [operation, platform] = args;

  if (!ALLOWED_OPERATIONS.has(operation)) {
    throw new Error(`Unsupported Capacitor operation: ${operation ?? "missing"}`);
  }

  if (!ALLOWED_PLATFORMS.has(platform)) {
    throw new Error(`Unsupported bundled mobile platform: ${platform ?? "missing"}`);
  }

  return { operation, platform };
}

export function assertBundledMobileOutput(rootDir = process.cwd()) {
  const indexPath = path.join(rootDir, "mobile-client", "out", "index.html");

  if (!existsSync(indexPath)) {
    throw new Error("Bundled mobile output is missing. Run npm run build:mobile before Capacitor copy/sync.");
  }

  return indexPath;
}

export function runBundledCapacitor({ operation, platform, rootDir = process.cwd(), env = process.env }) {
  assertBundledMobileOutput(rootDir);

  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(executable, ["cap", operation, platform], {
    cwd: rootDir,
    env: {
      ...env,
      INTELLECTX_MOBILE_BUNDLED: "true",
    },
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Capacitor ${operation} ${platform} failed with exit code ${result.status ?? "unknown"}.`);
  }
}

function main() {
  try {
    const command = resolveBundledCapacitorCommand(process.argv.slice(2));
    runBundledCapacitor(command);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
