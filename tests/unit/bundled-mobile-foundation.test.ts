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

  it("isolates mobile TypeScript validation from the full web application", () => {
    const rootTsconfig = JSON.parse(readRepositoryFile("tsconfig.json")) as {
      exclude?: string[];
    };
    const packageJson = JSON.parse(readRepositoryFile("package.json")) as {
      scripts?: Record<string, string>;
    };

    expect(rootTsconfig.exclude).toContain("mobile-client");
    expect(packageJson.scripts?.["typecheck:mobile"]).toBe("tsc -p mobile-client/tsconfig.json --noEmit");
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

  it("refreshes connectivity on foreground resume and removes every lifecycle listener on cleanup", () => {
    const shell = readRepositoryFile("mobile-client/components/mobile-shell.tsx");

    expect(shell).toContain('document.visibilityState === "visible"');
    expect(shell).toContain('document.addEventListener("visibilitychange", handleVisibilityChange)');
    expect(shell).toContain('document.removeEventListener("visibilitychange", handleVisibilityChange)');
    expect(shell).toContain('window.removeEventListener("online", updateConnectivity)');
    expect(shell).toContain('window.removeEventListener("offline", updateConnectivity)');
  });

  it("uses safe-area insets for the mobile shell and bottom navigation", () => {
    const styles = readRepositoryFile("mobile-client/app/globals.css");

    expect(styles).toContain("env(safe-area-inset-top)");
    expect(styles).toContain("env(safe-area-inset-bottom)");
  });

  it("provides route and runtime recovery without rendering raw exception details", () => {
    const notFound = readRepositoryFile("mobile-client/app/not-found.tsx");
    const errorBoundary = readRepositoryFile("mobile-client/app/error.tsx");

    expect(notFound).toContain("Back to quizzes");
    expect(errorBoundary).toContain('role="alert"');
    expect(errorBoundary).toContain("onClick={reset}");
    expect(errorBoundary).not.toContain("error.message");
    expect(errorBoundary).not.toContain("error.digest");
  });

  it("exposes explicit development, typecheck, static-build, and bundle-verification commands", () => {
    const packageJson = JSON.parse(readRepositoryFile("package.json")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["dev:mobile"]).toBe("next dev mobile-client --turbopack");
    expect(packageJson.scripts?.["typecheck:mobile"]).toBe("tsc -p mobile-client/tsconfig.json --noEmit");
    expect(packageJson.scripts?.["build:mobile"]).toBe("next build mobile-client");
    expect(packageJson.scripts?.["check:mobile-bundle"]).toBe("node scripts/check-mobile-bundle.mjs");
    expect(packageJson.scripts?.["verify:mobile-foundation"]).toContain("npm run build:mobile");
  });
});
