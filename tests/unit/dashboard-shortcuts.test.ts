import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { isLearnerAppPath } from "@/lib/learner-routes";

describe("dashboard study shortcuts", () => {
  it("keeps the web dashboard quiz shortcut on the web quizzes route", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/components/education/local-dashboard-content.tsx"),
      "utf8",
    );

    expect(source).toContain('href="/quizzes"');
    expect(source).not.toContain('href="/mobile-quizzes"');
  });

  it("keeps the web dashboard flashcard shortcut on a protected web route", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/components/education/local-dashboard-content.tsx"),
      "utf8",
    );

    expect(source).toContain('href="/flashcards"');
    expect(source).not.toContain('href="/mobile-flashcards"');
    expect(isLearnerAppPath("/flashcards")).toBe(true);
  });
});
