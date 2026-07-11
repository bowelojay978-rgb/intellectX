import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard study shortcuts", () => {
  it("keeps the web dashboard quiz shortcut on the web quizzes route", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/components/education/local-dashboard-content.tsx"),
      "utf8",
    );

    expect(source).toContain('href="/quizzes"');
    expect(source).not.toContain('href="/mobile-quizzes"');
  });
});
