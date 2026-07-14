import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const videoPlayerSource = readFileSync(
  path.join(process.cwd(), "src/components/education/video-player.tsx"),
  "utf8",
);

describe("lesson video recovery presentation contracts", () => {
  it("presents buffering as a polite temporary status and interrupted playback as retryable", () => {
    expect(videoPlayerSource).toContain("onWaiting={() =>");
    expect(videoPlayerSource).toContain("Video is buffering. Playback will resume automatically.");
    expect(videoPlayerSource).toContain('announcement: "polite"');
    expect(videoPlayerSource).toContain("onStalled={() =>");
    expect(videoPlayerSource).toContain(
      "Video playback was interrupted. Retry from your current position or check your connection.",
    );
    expect(videoPlayerSource).toContain('role={mediaNotice.announcement === "polite" ? "status" : "alert"}');
  });

  it("preserves the learner playback position when retry reloads interrupted media", () => {
    expect(videoPlayerSource).toContain("const retryTimeRef = useRef(0);");
    expect(videoPlayerSource).toContain("retryTimeRef.current = Number.isFinite(video.currentTime)");
    expect(videoPlayerSource).toContain("event.currentTarget.currentTime = retryTime;");
    expect(videoPlayerSource).toContain("retryTimeRef.current = 0;");
  });

  it("keeps corrupted media failures visible, retryable, and accessibly named", () => {
    expect(videoPlayerSource).toContain("onError={() =>");
    expect(videoPlayerSource).toContain("This video could not be loaded. Check your connection or try again.");
    expect(videoPlayerSource).toContain('aria-label="Retry video playback"');
    expect(videoPlayerSource).toContain("video.load();");
  });
});
