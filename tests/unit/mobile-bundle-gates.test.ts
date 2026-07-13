import { describe, expect, it } from "vitest";
import { evaluateMobileBundle } from "../../scripts/check-mobile-bundle.mjs";

type BundleFile = {
  relativePath: string;
  sizeBytes: number;
  content: string;
};

function file(relativePath: string, content = ""): BundleFile {
  return {
    relativePath,
    sizeBytes: Buffer.byteLength(content),
    content,
  };
}

const requiredFiles = [
  file("index.html", "<html>home</html>"),
  file("mobile-quizzes/index.html", "<html>quizzes</html>"),
  file("mobile-flashcards/index.html", "<html>flashcards</html>"),
];

describe("post-build mobile bundle gate", () => {
  it("passes the approved bundled route surface without sensitive quiz fields", () => {
    const report = evaluateMobileBundle({
      files: [...requiredFiles, file("_next/static/chunks/app.js", "const app='IntellectX';")],
    });

    expect(report.errors).toEqual([]);
    expect(report.fileCount).toBe(4);
    expect(report.totalBytes).toBeGreaterThan(0);
  });

  it("reports missing required entry points", () => {
    const report = evaluateMobileBundle({
      files: [file("index.html")],
    });

    expect(report.errors).toEqual(
      expect.arrayContaining([
        "missing bundled mobile entry point: mobile-quizzes/index.html",
        "missing bundled mobile entry point: mobile-flashcards/index.html",
      ]),
    );
  });

  it("rejects notes routes, answer-key fields, and the remote web deployment URL", () => {
    const report = evaluateMobileBundle({
      files: [
        ...requiredFiles,
        file("mobile-notes/index.html", "legacy notes"),
        file("_next/static/chunks/quiz.js", "const question={answerIndex:1};"),
        file("_next/static/chunks/runtime.js", "https://intellect-x-coral.vercel.app"),
      ],
    });

    expect(report.errors).toEqual(
      expect.arrayContaining([
        "bundled native scope must not include a mobile-notes route",
        "quiz answer-key field leaked into bundled asset: _next/static/chunks/quiz.js",
        "remote web deployment URL leaked into bundled asset: _next/static/chunks/runtime.js",
      ]),
    );
  });
});
