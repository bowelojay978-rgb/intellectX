import { describe, expect, it } from "vitest";

import { normalizeLearnerCourse, normalizeLearnerLesson, normalizeLearnerQuiz } from "@/lib/learner-catalog";
import { buildLearnerCatalog } from "@/lib/learner-catalog-client";
import type { Course } from "@/data/courses";
import type { Lesson } from "@/data/lessons";

const visibleCourseRecord = {
  stableId: "convex-course",
  slug: "convex-course",
  title: "Convex Course",
  description: "A backend-created learner-visible course.",
  subject: "AI Productivity",
  level: "Intermediate",
  duration: "2h",
  accent: "from-sky-500/20 via-white to-emerald-400/20",
  reviewStatus: "approved" as const,
  publicationStatus: "published" as const,
};

const visibleCourse = normalizeLearnerCourse(visibleCourseRecord) as Course;

describe("learner catalog normalization", () => {
  it("normalizes a learner-visible Convex course", () => {
    expect(visibleCourse).toMatchObject({
      id: "convex-course",
      slug: "convex-course",
      title: "Convex Course",
      level: "Intermediate",
      progress: 0,
      lessonIds: [],
      quizIds: [],
    });
  });

  it("keeps trusted bundled legacy records visible without weakening unknown records", () => {
    const bundledFallback: Course = {
      ...visibleCourse,
      id: "legacy-course",
      slug: "legacy-course",
      reviewStatus: "approved",
      publicationStatus: "published",
    };
    const legacyRecord = {
      ...visibleCourseRecord,
      stableId: "legacy-course",
      slug: "legacy-course",
      reviewStatus: undefined,
      publicationStatus: undefined,
    };

    expect(normalizeLearnerCourse(legacyRecord, bundledFallback)).toMatchObject({
      id: "legacy-course",
      reviewStatus: "approved",
      publicationStatus: "published",
    });
    expect(normalizeLearnerCourse(legacyRecord)).toBeNull();
  });

  it("fails closed for hidden course workflow states", () => {
    expect(
      normalizeLearnerCourse({
        ...visibleCourseRecord,
        stableId: "draft-course",
        reviewStatus: "draft",
        publicationStatus: "unpublished",
      }),
    ).toBeNull();

    expect(
      normalizeLearnerCourse({
        ...visibleCourseRecord,
        stableId: "approved-hidden",
        publicationStatus: "unpublished",
      }),
    ).toBeNull();
  });

  it("keeps paid content blocked without entitlement integration", () => {
    expect(normalizeLearnerCourse({ ...visibleCourseRecord, accessLevel: "paid" })).toBeNull();
    expect(
      normalizeLearnerLesson(
        {
          stableId: "paid-lesson",
          courseStableId: "convex-course",
          title: "Paid Lesson",
          duration: "10 min",
          summary: "Blocked",
          content: ["Hidden"],
          accessLevel: "paid",
        },
        { course: visibleCourse },
      ),
    ).toBeNull();
  });

  it("normalizes Convex lessons only when the parent course is visible", () => {
    const fallbackLesson: Lesson = {
      id: "lesson-one",
      courseId: "convex-course",
      title: "Fallback Lesson",
      duration: "5 min",
      summary: "Fallback summary",
      content: ["Fallback content"],
      blocks: [{ type: "text", body: "Fallback block" }],
    };

    const lesson = normalizeLearnerLesson(
      {
        stableId: "lesson-one",
        courseStableId: "convex-course",
        title: "Lesson One",
        duration: "12 min",
        summary: "A normalized lesson.",
        content: ["Paragraph one."],
        order: 1,
      },
      {
        course: visibleCourse,
        lessons: [
          {
            stableId: "lesson-one",
            courseStableId: "convex-course",
            title: "Lesson One",
            duration: "12 min",
            summary: "A normalized lesson.",
            content: ["Paragraph one."],
            order: 1,
          },
          {
            stableId: "lesson-two",
            courseStableId: "convex-course",
            title: "Lesson Two",
            duration: "8 min",
            summary: "Next lesson.",
            content: ["Paragraph two."],
            order: 2,
          },
        ],
        quizzes: [
          {
            stableId: "quiz-one",
            courseStableId: "convex-course",
            lessonStableId: "lesson-one",
            title: "Quiz One",
            difficulty: "Foundational",
            estimatedTime: "5 min",
          },
        ],
        fallback: fallbackLesson,
      },
    );

    expect(lesson).toMatchObject({
      id: "lesson-one",
      courseId: "convex-course",
      title: "Lesson One",
      nextLessonId: "lesson-two",
      quizId: "quiz-one",
      blocks: fallbackLesson.blocks,
    });
    expect(
      normalizeLearnerLesson(
        {
          stableId: "hidden-parent",
          courseStableId: "hidden-course",
          title: "Hidden Parent",
          duration: "5 min",
          summary: "Hidden",
          content: ["Hidden"],
        },
        { course: null },
      ),
    ).toBeNull();
  });

  it("normalizes quiz questions safely and rejects hidden parents or unknown playable quizzes", () => {
    const quiz = normalizeLearnerQuiz(
      {
        stableId: "quiz-one",
        courseStableId: "convex-course",
        lessonStableId: "lesson-one",
        title: "Quiz One",
        difficulty: "Not a real difficulty",
        estimatedTime: "5 min",
        questions: [
          {
            stableId: "bad",
            prompt: "Bad question",
            choices: ["Only one"],
            answerIndex: 0,
            explanation: "Invalid",
            order: 1,
          },
          {
            stableId: "q1",
            prompt: "Good question?",
            choices: ["No", "Yes"],
            answerIndex: 1,
            explanation: "Valid",
            order: 2,
          },
        ],
      },
      { course: visibleCourse },
    );

    expect(quiz).toMatchObject({
      id: "quiz-one",
      courseId: "convex-course",
      difficulty: "Foundational",
      questions: [
        {
          id: "q1",
          prompt: "Good question?",
          answerIndex: 1,
        },
      ],
    });
    expect(
      normalizeLearnerQuiz(
        {
          stableId: "hidden-quiz",
          courseStableId: "hidden-course",
          title: "Hidden Quiz",
          difficulty: "Foundational",
          estimatedTime: "5 min",
          questions: [
            {
              stableId: "q1",
              prompt: "Hidden?",
              choices: ["No", "Yes"],
              answerIndex: 1,
              explanation: "Hidden",
            },
          ],
        },
        { course: null },
      ),
    ).toBeNull();
    expect(
      normalizeLearnerQuiz(
        {
          stableId: "empty-quiz",
          courseStableId: "convex-course",
          title: "Empty Quiz",
          difficulty: "Foundational",
          estimatedTime: "5 min",
          questions: [],
        },
        { course: visibleCourse },
      ),
    ).toBeNull();
  });

  it("builds a learner catalog with Convex-only selected courses, lessons, and quizzes", () => {
    const catalog = buildLearnerCatalog({
      convexCourses: [visibleCourseRecord],
      convexLessons: [
        {
          stableId: "convex-lesson",
          courseStableId: "convex-course",
          title: "Convex Lesson",
          duration: "11 min",
          summary: "A dynamic lesson.",
          content: ["Dynamic content."],
          order: 1,
        },
      ],
      convexQuizzes: [
        {
          stableId: "convex-quiz",
          courseStableId: "convex-course",
          lessonStableId: "convex-lesson",
          title: "Convex Quiz",
          difficulty: "Applied",
          estimatedTime: "4 min",
          questions: [
            {
              stableId: "invalid",
              prompt: "Invalid?",
              choices: ["Only one"],
              answerIndex: 0,
              explanation: "Nope",
              order: 1,
            },
            {
              stableId: "valid",
              prompt: "Valid?",
              choices: ["No", "Yes"],
              answerIndex: 1,
              explanation: "Playable",
              order: 2,
            },
          ],
        },
      ],
    });

    expect(catalog.courseById.get("convex-course")?.lessonIds).toEqual(["convex-lesson"]);
    expect(catalog.courseById.get("convex-course")?.quizIds).toEqual(["convex-quiz"]);
    expect(catalog.lessonById.get("convex-lesson")?.title).toBe("Convex Lesson");
    expect(catalog.quizById.get("convex-quiz")?.questions).toHaveLength(1);
  });

  it("blocks hidden and paid dynamic records while preserving static fallback mode", () => {
    const liveCatalog = buildLearnerCatalog({
      convexCourses: [
        {
          ...visibleCourseRecord,
          stableId: "hidden-course",
          publicationStatus: "unpublished",
        },
        {
          ...visibleCourseRecord,
          stableId: "paid-course",
          accessLevel: "paid",
        },
      ],
      convexLessons: [],
      convexQuizzes: [],
    });

    expect(liveCatalog.courses).toHaveLength(0);
    expect(buildLearnerCatalog().courses.length).toBeGreaterThan(0);
  });
});
