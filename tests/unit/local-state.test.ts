import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearLearnerSession,
  createLearnerSession,
  getCurrentLearnerIdentity,
  getLearnerSession,
  LEARNER_SESSION_CHANGE_EVENT,
  LEARNER_SESSION_KEY,
} from "@/lib/learner-session";
import {
  ACADEMIC_PROFILE_KEY,
  isAcademicProfileComplete,
  loadAcademicProfile,
  saveAcademicProfile,
  type AcademicProfile,
} from "@/lib/academic-profile";
import {
  COURSE_SELECTION_LIMIT,
  getEmptyCourseSelection,
  normalizeCourseSelection,
  toggleSelectedCourse,
} from "@/lib/course-selection";
import {
  QUIZ_ATTEMPT_HISTORY_KEY,
  mergeQuizAttemptHistory,
  readQuizAttemptHistory,
  saveQuizAttemptHistoryItem,
  summarizeQuizAttemptHistory,
} from "@/lib/quiz-attempt-history";
import {
  LESSON_PROGRESS_HISTORY_KEY,
  recordLessonProgress,
  summarizeLessonProgressHistory,
  writeLessonProgressHistory,
} from "@/lib/lesson-progress-history";
import { summarizeStudyActivity } from "@/lib/study-activity-summary";

beforeEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("learner session local identity", () => {
  it("normalizes learner email and derives a stable local user key", () => {
    createLearnerSession({
      name: "Bowel",
      email: "  BOWEL@Example.COM ",
      role: "student",
    });

    expect(getLearnerSession()).toEqual({
      name: "Bowel",
      email: "bowel@example.com",
      role: "student",
    });

    expect(getCurrentLearnerIdentity()).toMatchObject({
      email: "bowel@example.com",
      userKey: "learner:bowel@example.com",
      source: "local-session",
    });
  });

  it("clears invalid stored learner sessions instead of crashing", () => {
    localStorage.setItem(LEARNER_SESSION_KEY, "{bad json");

    expect(getLearnerSession()).toBeNull();
    expect(localStorage.getItem(LEARNER_SESSION_KEY)).toBeNull();
  });

  it("clears stored learner sessions missing an email", () => {
    localStorage.setItem(
      LEARNER_SESSION_KEY,
      JSON.stringify({
        name: "No Email",
        role: "student",
      }),
    );

    expect(getLearnerSession()).toBeNull();
    expect(localStorage.getItem(LEARNER_SESSION_KEY)).toBeNull();
  });

  it("migrates legacy learner sessions into the current storage key", () => {
    localStorage.setItem(
      "intellectx-demo-session",
      JSON.stringify({
        name: "Legacy Learner",
        email: "  LEGACY@Example.COM ",
        role: "student",
      }),
    );

    expect(getLearnerSession()).toEqual({
      name: "Legacy Learner",
      email: "legacy@example.com",
      role: "student",
    });
    expect(localStorage.getItem("intellectx-demo-session")).toBeNull();
    expect(localStorage.getItem(LEARNER_SESSION_KEY)).not.toBeNull();
  });

  it("clears the current learner session", () => {
    createLearnerSession({
      name: "Learner",
      email: "learner@example.com",
      role: "student",
    });

    clearLearnerSession();

    expect(getLearnerSession()).toBeNull();
  });

  it("dispatches the learner session change event when creating a session", () => {
    const listener = vi.fn();
    window.addEventListener(LEARNER_SESSION_CHANGE_EVENT, listener);

    createLearnerSession({
      name: "Learner",
      email: "learner@example.com",
      role: "student",
    });

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(LEARNER_SESSION_CHANGE_EVENT, listener);
  });

  it("dispatches the learner session change event when clearing a session", () => {
    const listener = vi.fn();
    createLearnerSession({
      name: "Learner",
      email: "learner@example.com",
      role: "student",
    });

    window.addEventListener(LEARNER_SESSION_CHANGE_EVENT, listener);
    clearLearnerSession();

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(LEARNER_SESSION_CHANGE_EVENT, listener);
  });
});

describe("academic profile local state", () => {
  it("clears invalid stored academic profile JSON instead of crashing", () => {
    localStorage.setItem(ACADEMIC_PROFILE_KEY, "{bad json");

    expect(loadAcademicProfile()).toBeNull();
    expect(localStorage.getItem(ACADEMIC_PROFILE_KEY)).toBeNull();
  });

  it("detects incomplete academic profiles", () => {
    expect(
      isAcademicProfileComplete({
        educationLevel: "Senior",
        curriculumOrInstitution: "Botswana curriculum",
        gradeOrYear: "Form 5",
        subjectsOrModules: [],
      }),
    ).toBe(false);

    expect(loadAcademicProfile()).toBeNull();
  });

  it("saves and loads a complete academic profile", () => {
    const profile: AcademicProfile = {
      educationLevel: "Senior",
      curriculumOrInstitution: "Botswana curriculum",
      gradeOrYear: "Form 5",
      subjectsOrModules: ["AI Productivity"],
    };

    saveAcademicProfile(profile);

    expect(loadAcademicProfile()).toEqual(profile);
    expect(isAcademicProfileComplete(loadAcademicProfile())).toBe(true);
  });
});

describe("course selection rules", () => {
  it("deduplicates selected courses and starts the grace period", () => {
    const now = new Date("2026-07-05T10:00:00Z").getTime();

    const selection = normalizeCourseSelection(
      {
        ...getEmptyCourseSelection(),
        selectedCourseIds: ["ai-study-systems", "ai-study-systems", "exam-accelerator"],
      },
      now,
    );

    expect(selection.selectedCourseIds).toEqual(["ai-study-systems", "exam-accelerator"]);
    expect(selection.selectedAt).toBe(now);
    expect(selection.gracePeriodEndsAt).toBe(now + 7 * 24 * 60 * 60 * 1000);
    expect(selection.locked).toBe(false);
  });

  it("locks selections after the grace period expires", () => {
    const selectedAt = new Date("2026-07-01T00:00:00Z").getTime();
    const afterGrace = selectedAt + 8 * 24 * 60 * 60 * 1000;

    const selection = normalizeCourseSelection(
      {
        selectedCourseIds: ["ai-study-systems"],
        selectedAt,
        gracePeriodEndsAt: selectedAt + 7 * 24 * 60 * 60 * 1000,
        lockedAt: null,
        locked: false,
      },
      afterGrace,
    );

    expect(selection.locked).toBe(true);
    expect(selection.lockedAt).toBe(selectedAt + 7 * 24 * 60 * 60 * 1000);
  });

  it("prevents selecting more than the configured course limit", () => {
    const baseSelection = {
      ...getEmptyCourseSelection(),
      selectedCourseIds: Array.from({ length: COURSE_SELECTION_LIMIT }, (_, index) => `course-${index}`),
      selectedAt: Date.now(),
      gracePeriodEndsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    const result = toggleSelectedCourse("course-extra", baseSelection);

    expect(result.error).toBe(`You can select up to ${COURSE_SELECTION_LIMIT} courses.`);
    expect(result.selection.selectedCourseIds).toHaveLength(COURSE_SELECTION_LIMIT);
  });
});

describe("quiz attempt history", () => {
  it("saves attempts with a calculated percentage", () => {
    const attempt = saveQuizAttemptHistoryItem({
      quizId: "exam-accelerator-check",
      quizTitle: "Exam Accelerator Check",
      score: 4,
      totalQuestions: 5,
    });

    expect(attempt.percentage).toBe(80);

    const stored = readQuizAttemptHistory();
    expect(stored).toHaveLength(1);
    expect(stored[0].percentage).toBe(80);
  });

  it("filters invalid stored attempts", () => {
    localStorage.setItem(
      QUIZ_ATTEMPT_HISTORY_KEY,
      JSON.stringify([
        { quizId: "valid", quizTitle: "Valid", score: 1, totalQuestions: 2, percentage: 50, completedAt: "2026-07-05T10:00:00.000Z" },
        { quizId: "invalid", score: "bad" },
      ]),
    );

    expect(readQuizAttemptHistory()).toHaveLength(1);
  });

  it("merges likely duplicate attempts only once", () => {
    const attempt = {
      quizId: "quiz-a",
      quizTitle: "Quiz A",
      score: 3,
      totalQuestions: 4,
      percentage: 75,
      completedAt: "2026-07-05T10:00:00.000Z",
    };

    mergeQuizAttemptHistory([attempt, { ...attempt, completedAt: "2026-07-05T10:00:05.000Z" }]);

    expect(readQuizAttemptHistory()).toHaveLength(1);
  });

  it("summarizes latest attempts by quiz", () => {
    const summary = summarizeQuizAttemptHistory([
      { quizId: "quiz-a", quizTitle: "Quiz A", score: 1, totalQuestions: 2, percentage: 50, completedAt: "2026-07-04T10:00:00.000Z" },
      { quizId: "quiz-a", quizTitle: "Quiz A", score: 2, totalQuestions: 2, percentage: 100, completedAt: "2026-07-05T10:00:00.000Z" },
    ]);

    expect(summary.attemptCount).toBe(2);
    expect(summary.averagePercentage).toBe(75);
    expect(summary.latestByQuizId["quiz-a"].percentage).toBe(100);
  });

  it("preserves Convex-only quiz attempts without static quiz catalog records", () => {
    const summary = summarizeQuizAttemptHistory([
      {
        quizId: "convex-only-quiz",
        quizTitle: "Convex Only Quiz",
        score: 4,
        totalQuestions: 5,
        percentage: 80,
        completedAt: "2026-07-05T10:00:00.000Z",
      },
    ]);

    expect(summary.attemptCount).toBe(1);
    expect(summary.latestByQuizId["convex-only-quiz"].quizTitle).toBe("Convex Only Quiz");
  });
});

describe("lesson progress history", () => {
  it("clamps lesson progress and stores latest item", () => {
    const item = recordLessonProgress({
      lessonId: "memory-systems",
      status: "in_progress",
      progress: 150,
      updatedAt: "2026-07-05T10:00:00.000Z",
    });

    expect(item.progress).toBe(100);

    const stored = JSON.parse(localStorage.getItem(LESSON_PROGRESS_HISTORY_KEY) ?? "[]");
    expect(stored[0].progress).toBe(100);
  });

  it("keeps only the latest progress per lesson", () => {
    const history = writeLessonProgressHistory([
      { lessonId: "lesson-a", status: "in_progress", progress: 25, updatedAt: "2026-07-04T10:00:00.000Z" },
      { lessonId: "lesson-a", status: "completed", progress: 100, updatedAt: "2026-07-05T10:00:00.000Z" },
    ]);

    expect(history).toHaveLength(1);
    expect(history[0].status).toBe("completed");
  });

  it("summarizes lesson progress without fake activity", () => {
    const summary = summarizeLessonProgressHistory([
      { lessonId: "lesson-a", status: "in_progress", progress: 25, updatedAt: "2026-07-04T10:00:00.000Z" },
      { lessonId: "lesson-b", status: "completed", progress: 100, updatedAt: "2026-07-05T10:00:00.000Z" },
    ]);

    expect(summary.lessonCount).toBe(2);
    expect(summary.inProgressCount).toBe(1);
    expect(summary.completedCount).toBe(1);
  });

  it("preserves Convex-only lesson progress metadata", () => {
    const history = writeLessonProgressHistory([
      {
        lessonId: "convex-only-lesson",
        lessonTitle: "Convex Only Lesson",
        status: "completed",
        progress: 100,
        updatedAt: "2026-07-05T10:00:00.000Z",
      },
    ]);

    expect(history[0]).toMatchObject({
      lessonId: "convex-only-lesson",
      lessonTitle: "Convex Only Lesson",
      progress: 100,
    });
  });
});

describe("study activity summary", () => {
  it("returns an empty summary when there is no real activity", () => {
    const summary = summarizeStudyActivity([], [], new Date("2026-07-05T12:00:00.000Z"));

    expect(summary.activeDateCount).toBe(0);
    expect(summary.lastStudiedLabel).toBe("Not recorded yet");
    expect(summary.currentStreak).toBe(0);
  });

  it("calculates current streak, longest streak, and weekly active days", () => {
    const summary = summarizeStudyActivity(
      [
        { lessonId: "lesson-a", status: "completed", progress: 100, updatedAt: "2026-07-03T10:00:00.000Z" },
        { lessonId: "lesson-b", status: "completed", progress: 100, updatedAt: "2026-07-04T10:00:00.000Z" },
      ],
      [
        { quizId: "quiz-a", quizTitle: "Quiz A", score: 2, totalQuestions: 2, percentage: 100, completedAt: "2026-07-05T10:00:00.000Z" },
      ],
      new Date("2026-07-05T12:00:00.000Z"),
    );

    expect(summary.activeDateCount).toBe(3);
    expect(summary.currentStreak).toBe(3);
    expect(summary.longestStreak).toBe(3);
    expect(summary.isActiveToday).toBe(true);
    expect(summary.lastStudiedLabel).toBe("Today");
    expect(summary.weeklyActiveDayLabels).toEqual(["Sun", "Sat", "Fri"]);
  });
});
