import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const coursesSource = readSource("src/components/education/convex-courses-section.tsx");
const progressSource = readSource("src/components/education/local-progress-content.tsx");
const lessonPageSource = readSource("src/app/learn/[lessonId]/page.tsx");

describe("final frontend checklist cleanup", () => {
  it("keeps the stale filtered-profile message and edit-profile shortcut off the Courses page", () => {
    expect(coursesSource).not.toContain("Filtered for");
    expect(coursesSource).not.toContain('Link href="/profile#study-profile">Edit profile</Link>');
  });

  it("shows honest lesson-derived progress for every selected course", () => {
    expect(progressSource).toContain('import { calculateCourseProgress } from "@/lib/course-progress"');
    expect(progressSource).toContain("const history = readLessonProgressHistory()");
    expect(progressSource).toContain("progress: calculateCourseProgress(course.lessonIds, lessonHistory)");
    expect(progressSource).toContain("selectedCoursesWithProgress.map((course)");
    expect(progressSource).toContain("<CourseCard key={course.id} course={course} />");
    expect(progressSource).not.toContain("showProgress={false}");
  });

  it("keeps the lesson video player visible on responsive web", () => {
    expect(lessonPageSource).toContain("<VideoPlayer");
    expect(lessonPageSource).not.toContain('className="hidden lg:block"');
  });
});
