import { describe, expect, it } from "vitest";

import { normalizeInstructorCourseDraftInput } from "../../convex/lib/instructorCourseWorkspace";

function draftWithMedia(videoUrl?: string, posterUrl?: string) {
  return {
    stableId: "biology-core",
    slug: "biology-core",
    title: "Biology Core",
    description: "A focused biology course.",
    subject: "Biology",
    level: "Advanced",
    duration: "12 weeks",
    accent: "from-slate-500 to-slate-700",
    lessons: [
      {
        stableId: "cell-structure",
        title: "Cell structure",
        duration: "15 min",
        summary: "Understand cell organelles.",
        content: ["Nucleus controls cell activity."],
        videoUrl,
        posterUrl,
      },
    ],
    quizzes: [],
  };
}

describe("instructor lesson media URL policy", () => {
  it("accepts trimmed http and https lesson media URLs", () => {
    const normalized = normalizeInstructorCourseDraftInput(
      draftWithMedia("  https://example.com/video.mp4  ", "http://example.com/poster.jpg"),
    );

    expect(normalized.lessons[0].videoUrl).toBe("https://example.com/video.mp4");
    expect(normalized.lessons[0].posterUrl).toBe("http://example.com/poster.jpg");
  });

  it("rejects executable, data, and malformed lesson media URLs", () => {
    expect(() => normalizeInstructorCourseDraftInput(draftWithMedia("javascript:alert(1)"))).toThrow(
      "Lesson 1 video URL must be a valid http or https URL.",
    );
    expect(() => normalizeInstructorCourseDraftInput(draftWithMedia(undefined, "data:image/png;base64,abc"))).toThrow(
      "Lesson 1 poster URL must be a valid http or https URL.",
    );
    expect(() => normalizeInstructorCourseDraftInput(draftWithMedia("not-a-url"))).toThrow(
      "Lesson 1 video URL must be a valid http or https URL.",
    );
  });
});
