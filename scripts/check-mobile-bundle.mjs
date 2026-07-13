import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const REQUIRED_ENTRY_POINTS = [
  "index.html",
  "mobile-quizzes/index.html",
  "mobile-flashcards/index.html",
];

const TEXT_EXTENSIONS = new Set([".html", ".js", ".json", ".css", ".txt", ".map"]);

function collectFiles(directory, root = directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectFiles(absolutePath, root);
    }

    if (!entry.isFile()) {
      return [];
    }

    return [
      {
        absolutePath,
        relativePath: path.relative(root, absolutePath).replaceAll(path.sep, "/"),
        sizeBytes: statSync(absolutePath).size,
      },
    ];
  });
}

export function evaluateMobileBundle({ files, requiredEntryPoints = REQUIRED_ENTRY_POINTS }) {
  const errors = [];
  const fileByPath = new Map(files.map((file) => [file.relativePath, file]));

  for (const entryPoint of requiredEntryPoints) {
    if (!fileByPath.has(entryPoint)) {
      errors.push(`missing bundled mobile entry point: ${entryPoint}`);
    }
  }

  if (files.some((file) => file.relativePath.startsWith("mobile-notes/"))) {
    errors.push("bundled native scope must not include a mobile-notes route");
  }

  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(file.relativePath))) {
      continue;
    }

    const source = file.content ?? "";

    if (source.includes("answerIndex")) {
      errors.push(`quiz answer-key field leaked into bundled asset: ${file.relativePath}`);
    }

    if (source.includes("https://intellect-x-coral.vercel.app")) {
      errors.push(`remote web deployment URL leaked into bundled asset: ${file.relativePath}`);
    }
  }

  return {
    errors: [...new Set(errors)],
    totalBytes: files.reduce((total, file) => total + file.sizeBytes, 0),
    fileCount: files.length,
  };
}

export function inspectCurrentMobileBundle(rootDir = process.cwd()) {
  const outputDir = path.join(rootDir, "mobile-client", "out");
  const diskFiles = collectFiles(outputDir);
  const files = diskFiles.map((file) => ({
    ...file,
    content: TEXT_EXTENSIONS.has(path.extname(file.relativePath)) ? readFileSync(file.absolutePath, "utf8") : "",
  }));

  return {
    outputDir,
    ...evaluateMobileBundle({ files }),
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

export function printMobileBundleReport(report) {
  console.log(`Mobile bundle output: ${report.outputDir}`);
  console.log(`Mobile bundle files: ${report.fileCount}`);
  console.log(`Mobile bundle size: ${formatBytes(report.totalBytes)}`);

  if (report.errors.length === 0) {
    console.log("Mobile bundle gate: passed");
    return;
  }

  console.error("Mobile bundle gate: blocked");
  for (const error of report.errors) {
    console.error(`- ${error}`);
  }
}

function main() {
  const report = inspectCurrentMobileBundle();
  printMobileBundleReport(report);

  if (report.errors.length > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
