import { describe, expect, it } from "vitest";

import {
  assertCourseSubmissionReady,
  assertInstructorCourseEditable,
  getCourseSubmissionReadinessIssues,
  normalizeInstructorCourseDraftInput,
} from "../../convex/lib/instructorCourseWorkspace";
import {
  APPROVED,
  CHANGES_REQUESTED,
  DRAFT,
  PUBLISHED,
  SUBMITTED_FOR_REVIEW,
} from "../../convex/lib/courseWorkflowMutations";
import {
  isInstructorCourseEditable,
  isInstructorLearnerPreviewAvailable,
  resolveInstructorCourseStatus,
} from "@/lib/instructor-course-workspace";

function validDraft() {
  return {
    stableId: "biology-core",
    slug: "biology-core",
    title: "  Biology Core  ",
    description: "  A focused biology course.  ",
    subject: "  Biology  ",
    level: "  A-Level  ",
    duration: "  12 weeks  ",
    accent: "  from-slate-500 to-slate-700  ",
    lessons: [
      {
        stableId: "cell-structure",
        title: "  Cell structure  ",
        duration: "  15 min  ",
        summary: "  Understand cell organelles.  ",
        content: ["  Nucleus controls cell activity.  ", "  ", "Mitochondria release energy."],
        videoUrl: "  https://example.com/video  ",
      },
    ],
    quizzes: [
      {
        stableId: "cell-structure-check",
        lessonStableId: "cell-structure",
        title: "  Cell structure check  ",
        difficulty: "  Beginner  ",
        estimatedTime: "  5 min  ",
        questions: [
          {
            stableId: "cell-q1",
            prompt: "  Which organelle contains DNA?  ",
            choices: ["  Nucleus  ", "Ribosome", "  "],
            answerIndex: 0,
            explanation: "  The nucleus contains genetic material.  ",
          },
        ],
      },
    ],
  };
}

function readyContent() {
  return {
    lessons: [
      {
        stableId: "cell-structure",
        title: "Cell structure",
        duration: "15 min",
        summary: "Understand cell organelles.",
        content: ["Nucleus controls cell activity."],
      },
    ],
    quizzes: [
      {
        stableId: "cell-structure-check",
        title: "Cell structure check",
      },
    ],
    questions: [
      {
        quizStableId: "cell-structure-check",
        prompt: "Which organelle contains DNA?",
        choices: ["Nucleus", "Ribosome"],
        answerIndex: 0,
        explanation: "The nucleus contains genetic material.",
      },
    ],
  };
}

describe("instructor course draft validation", () => {
  it("normalizes production course, lesson, quiz, and question input", () => {
    const normalized = normalizeInstructorCourseDraftInput(validDraft());

    expect(normalized.title).toBe("Biology Core");
    expect(normalized.description).toBe("A focused biology course.");
    expect(normalized.lessons[0]).toMatchObject({
      title: "Cell structure",
      duration: "15 min",
      summary: "Understand cell organelles.",
      content: ["Nucleus controls cell activity.", "Mitochondria release energy."],
      videoUrl: "https://example.com/video",
      order: 0,
    });
    expect(normalized.quizzes[0]).toMatchObject({
      title: "Cell structure check",
      difficulty: "Beginner",
      estimatedTime: "5 min",
      order: 0,
    });
    expect(normalized.quizzes[0].questions[0]).toMatchObject({
      prompt: "Which organelle contains DNA?",
      choices: ["Nucleus", "Ribosome", ""],
      explanation: "The nucleus contains genetic material.",
      order: 0,
    });
  });

  it("rejects malformed course identifiers", () => {
    expect(() =>
      normalizeInstructorCourseDraftInput({
        ...validDraft(),
        stableId: "Biology Core",
      }),
    ).toThrow("Course stableId must use lowercase letters, numbers, and single hyphens only.");
  });

  it("rejects duplicate lesson identifiers", () => {
    const draft = validDraft();

    expect(() =>
      normalizeInstructorCourseDraftInput({
        ...draft,
        lessons: [...draft.lessons, { ...draft.lessons[0] }],
      }),
    ).toThrow("Duplicate lesson stableId: cell-structure.");
  });

  it("rejects quizzes linked to lessons outside the course", () => {
    const draft = validDraft();

    expect(() =>
      normalizeInstructorCourseDraftInput({
        ...draft,
        quizzes: [{ ...draft.quizzes[0], lessonStableId: "missing-lesson" }],
      }),
    ).toThrow("references a lesson that is not part of this course");
  });
});

describe("instructor course review readiness", () => {
  it("requires at least one complete lesson", () => {
    expect(
      getCourseSubmissionReadinessIssues({
        lessons: [],
        quizzes: [],
        questions: [],
      }),
    ).toContain("Add at least one lesson before submitting for review.");
  });

  it("blocks incomplete lesson content", () => {
    const content = readyContent();
    content.lessons[0].content = [];

    expect(getCourseSubmissionReadinessIssues(content)[0]).toContain("Complete the title, duration, summary, and content");
  });

  it("blocks quizzes without questions", () => {
    const content = readyContent();
    content.questions = [];

    expect(getCourseSubmissionReadinessIssues(content)[0]).toContain("Add at least one question to quiz");
  });

  it("blocks incomplete questions and accepts complete review content", () => {
    const content = readyContent();
    content.questions[0].choices = ["Nucleus", ""];

    expect(getCourseSubmissionReadinessIssues(content)[0]).toContain("Complete every prompt, answer option, correct answer, and explanation");

    expect(getCourseSubmissionReadinessIssues(readyContent())).toEqual([]);
    expect(() => assertCourseSubmissionReady(readyContent())).not.toThrow();
  });
});

describe("instructor workflow editability", () => {
  it("allows edits only for draft and changes-requested courses", () => {
    expect(() => assertInstructorCourseEditable({ reviewStatus: DRAFT })).not.toThrow();
    expect(() => assertInstructorCourseEditable({ reviewStatus: CHANGES_REQUESTED })).not.toThrow();
    expect(() => assertInstructorCourseEditable({ reviewStatus: SUBMITTED_FOR_REVIEW })).toThrow(
      "Course can only be edited while in draft or changes_requested state.",
    );

    expect(isInstructorCourseEditable({ reviewStatus: DRAFT })).toBe(true);
    expect(isInstructorCourseEditable({ reviewStatus: CHANGES_REQUESTED })).toBe(true);
    expect(isInstructorCourseEditable({ reviewStatus: APPROVED })).toBe(false);
  });

  it("treats only approved and published courses as learner-previewable", () => {
    expect(isInstructorLearnerPreviewAvailable({ reviewStatus: APPROVED, publicationStatus: PUBLISHED })).toBe(true);
    expect(isInstructorLearnerPreviewAvailable({ reviewStatus: APPROVED, publicationStatus: "unpublished" })).toBe(false);
    expect(resolveInstructorCourseStatus({ reviewStatus: APPROVED, publicationStatus: PUBLISHED })).toBe(PUBLISHED);
  });
});
