import { spawnSync } from "node:child_process";

const modes = {
  quick: ["typecheck", "test:unit"],
  standard: ["typecheck", "lint", "test:unit", "build"],
  full: ["typecheck", "lint", "test:unit", "build", "test:e2e"],
  convex: ["convex:codegen", "typecheck", "lint", "test:unit", "build"],
};

const mode = process.argv[2] ?? "standard";
const steps = modes[mode];

if (!steps) {
  console.error(`Unknown validation mode: ${mode}`);
  console.error(`Available modes: ${Object.keys(modes).join(", ")}`);
  process.exit(1);
}

console.log(`\nIntellectX validation mode: ${mode}`);
console.log(`Steps: ${steps.join(" -> ")}\n`);

for (const script of steps) {
  console.log(`\n=== npm run ${script} ===\n`);

  const result = spawnSync("npm", ["run", script], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  if (result.error) {
    console.error(`Failed to start npm run ${script}:`, result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\nValidation stopped: npm run ${script} failed with exit code ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\nValidation passed: ${mode}\n`);
