import { beforeEach, describe, expect, it } from "vitest";

import {
  loadAcademicProfile,
  saveAcademicProfile,
  type AcademicProfile,
} from "@/lib/academic-profile";
import {
  hydrateAuthenticatedAcademicProfile,
  hydrateAuthenticatedCourseSelection,
  hydrateAuthenticatedLessonProgressHistory,
  hydrateAuthenticatedQuizAttemptHistory,
} from "@/lib/authenticated-learner-hydration";
import { loadCourseSelection, saveCourseSelection } from "@/lib/course-selection";
import { readLessonProgressHistory, writeLessonProgressHistory } from "@/lib/lesson-progress-history";
import { readQuizAttemptHistory, writeQuizAttemptHistory } from "@/lib/quiz-attempt-history";

const profile: AcademicProfile = {
  educationLevel: "Senior",
  curriculumOrInstitution: "Botswana curriculum",
  gradeOrYear: "Form 5",
  subjectsOrModules: ["Mathematics"],
};

beforeEach(() => {
  localStorage.clear();
});

describe("authenticated learner hydration authority", () => {
  it("clears stale local academic profile when authenticated remote profile is empty", () => {
    saveAcademicProfile(profile);

    expect(hydrateAuthenticatedAcademicProfile(null, false)).toBe("cleared");
    expect(loadAcademicProfile()).toBeNull();
  });

  it("preserves local academic profile while an explicit local-to-auth migration source is pending", () => {
    saveAcademicProfile(profile);

    expect(hydrateAuthenticatedAcademicProfile(null, true)).toBe("deferred-for-migration");
    expect(loadAcademicProfile()).toEqual(profile);
  });

  it("replaces local academic profile with authoritative authenticated remote data", () => {
    const remoteProfile: AcademicProfile = {
      ...profile,
      subjectsOrModules: ["Biology", "Chemistry"],
    };

    saveAcademicProfile(profile);

    expect(hydrateAuthenticatedAcademicProfile(remoteProfile, false)).toBe("replaced");
    expect(loadAcademicProfile()).toEqual(remoteProfile);
  });

  it("clears stale local course selection when authenticated remote selection is empty", () => {
    saveCourseSelection({
      selectedCourseIds: ["math-1"],
      selectedAt: 1,
      gracePeriodEndsAt: 2,
      lockedAt: null,
      locked: false,
    });

    expect(hydrateAuthenticatedCourseSelection(null, false)).toBe("cleared");
    expect(loadCourseSelection().selectedCourseIds).toEqual([]);
  });

  it("replaces stale quiz history with authoritative authenticated empty remote history", () => {
    writeQuizAttemptHistory([
      {
        quizId: "quiz-A",
        quizTitle: "Account A quiz",
        score: 1,
        totalQuestions: 1,
        percentage: 100,
        completedAt: "2026-07-10T10:00:00.000Z",
      },
    ]);

    expect(hydrateAuthenticatedQuizAttemptHistory([], false)).toBe("replaced");
    expect(readQuizAttemptHistory()).toEqual([]);
  });

  it("replaces stale lesson history with authoritative authenticated empty remote history", () => {
    writeLessonProgressHistory([
      {
        lessonId: "lesson-A",
        status: "in_progress",
        progress: 25,
        updatedAt: "2026-07-10T10:00:00.000Z",
      },
    ]);

    expect(hydrateAuthenticatedLessonProgressHistory([], false)).toBe("replaced");
    expect(readLessonProgressHistory()).toEqual([]);
  });

  it("does not replace local quiz or lesson history while migration is pending", () => {
    const quizAttempt = {
      quizId: "quiz-local",
      quizTitle: "Local quiz",
      score: 1,
      totalQuestions: 1,
      percentage: 100,
      completedAt: "2026-07-10T10:00:00.000Z",
    };
    const lessonProgress = {
      lessonId: "lesson-local",
      status: "in_progress",
      progress: 25,
      updatedAt: "2026-07-10T10:00:00.000Z",
    };

    writeQuizAttemptHistory([quizAttempt]);
    writeLessonProgressHistory([lessonProgress]);

    expect(hydrateAuthenticatedQuizAttemptHistory([], true)).toBe("deferred-for-migration");
    expect(hydrateAuthenticatedLessonProgressHistory([], true)).toBe("deferred-for-migration");
    expect(readQuizAttemptHistory()).toEqual([quizAttempt]);
    expect(readLessonProgressHistory()).toEqual([lessonProgress]);
  });
});
