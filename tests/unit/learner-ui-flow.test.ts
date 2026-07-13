import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("learner UI flow contracts", () => {
  it("uses shared auth state for homepage entry actions", () => {
    const hero = readSource("src/components/hero/hero.tsx");
    const entryLink = readSource("src/components/auth/learner-entry-link.tsx");

    expect(hero).toContain("useLearnerAccessState");
    expect(hero).toContain('signedInHref="/dashboard"');
    expect(hero).toContain("Continue Learning");
    expect(entryLink).toContain("isSignedIn ? signedInHref : signedOutHref");
  });

  it("keeps Clerk functionality inside the restored IntellectX access card", () => {
    const source = readSource("src/components/auth/clerk-auth-panel.tsx");

    expect(source).toContain("<SignIn");
    expect(source).toContain("<SignUp");
    expect(source).toContain("clerkAppearance");
    expect(source).toContain("ShieldCheckIcon");
  });

  it("provides a full lesson player control set and side playlist", () => {
    const source = readSource("src/components/education/video-player.tsx");

    for (const contract of [
      "Video progress",
      "Volume",
      "Playback settings",
      "Picture in picture",
      "Fullscreen",
      "Course playlist",
      "playbackSpeeds",
    ]) {
      expect(source).toContain(contract);
    }
  });
});
