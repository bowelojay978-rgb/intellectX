import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readRepositoryFile(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("bundled mobile runtime foundation", () => {
  it("uses a dedicated static export without changing the full web app configuration", () => {
    const mobileConfig = readRepositoryFile("mobile-client/next.config.mjs");
    const rootConfig = readRepositoryFile("next.config.ts");

    expect(mobileConfig).toContain('output: "export"');
    expect(mobileConfig).toContain("trailingSlash: true");
    expect(rootConfig).not.toContain('output: "export"');
  });

  it("reuses shared quiz and lesson sources instead of defining a competing catalog", () => {
    const catalog = readRepositoryFile("mobile-client/lib/mobile-catalog.ts");

    expect(catalog).toContain('from "@/data/lessons"');
    expect(catalog).toContain('from "@/data/quizzes"');
    expect(catalog).toContain('from "@/lib/flashcard-review"');
    expect(catalog).not.toContain("const quizzes = [");
    expect(catalog).not.toContain("const lessons = [");
  });

  it("keeps quiz answer keys and client-owned scoring out of the bundled foundation", () => {
    const catalog = readRepositoryFile("mobile-client/lib/mobile-catalog.ts");
    const quizPage = readRepositoryFile("mobile-client/app/mobile-quizzes/page.tsx");

    expect(catalog).not.toContain("answerIndex:");
    expect(catalog).not.toContain("explanation:");
    expect(quizPage).not.toContain("answerIndex");
    expect(quizPage).not.toContain("scoreQuiz");
  });

  it("keeps the native product scope limited to quizzes and flashcards", () => {
    const shell = readRepositoryFile("mobile-client/components/mobile-shell.tsx");
    const home = readRepositoryFile("mobile-client/app/page.tsx");

    expect(shell).toContain('href: "/mobile-quizzes/"');
    expect(shell).toContain('href: "/mobile-flashcards/"');
    expect(shell).not.toContain("mobile-notes");
    expect(home).not.toContain("Notes");
  });

  it("exposes explicit development and static-build commands for the mobile target", () => {
    const packageJson = JSON.parse(readRepositoryFile("package.json")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["dev:mobile"]).toBe("next dev mobile-client --turbopack");
    expect(packageJson.scripts?.["build:mobile"]).toBe("next build mobile-client");
  });
});
