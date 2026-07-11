import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import {
  ACADEMIC_PROFILE_KEY,
  saveAcademicProfile,
  type AcademicProfile,
} from "@/lib/academic-profile";
import {
  ACTIVE_CLERK_LEARNER_USER_KEY,
  clearAuthenticatedLearnerLocalData,
  hasPendingLocalLearnerMigrationSource,
  shouldClearAuthenticatedLearnerLocalDataForTransition,
} from "@/lib/authenticated-learner-local-data";
import { CLERK_LOGIN_REDIRECT_URL, CLERK_SIGNUP_REDIRECT_URL } from "@/lib/auth-redirects";
import { COURSE_SELECTION_KEY, saveCourseSelection } from "@/lib/course-selection";
import { resolveConvexLearnerIdentity } from "@/lib/convex-learner-identity";
import { createLearnerSession, getLearnerSession, LEARNER_SESSION_KEY } from "@/lib/learner-session";
import { LESSON_PROGRESS_HISTORY_KEY, writeLessonProgressHistory } from "@/lib/lesson-progress-history";
import { getLocalLearnerMigrationMarkerKey } from "@/lib/local-learner-migration";
import { QUIZ_ATTEMPT_HISTORY_KEY, writeQuizAttemptHistory } from "@/lib/quiz-attempt-history";

const profile: AcademicProfile = {
  educationLevel: "Senior",
  curriculumOrInstitution: "Botswana curriculum",
  gradeOrYear: "Form 5",
  subjectsOrModules: ["Mathematics"],
};

beforeEach(() => {
  localStorage.clear();
});

describe("auth/data-flow safety guards", () => {
  it("keeps direct Clerk hooks out of shared learner sync components used in Convex-only mode", () => {
    const sharedSyncFiles = [
      "src/components/education/academic-profile-sync.tsx",
      "src/components/education/course-selection-sync.tsx",
      "src/components/education/lesson-progress-history-sync.tsx",
      "src/components/education/lesson-progress-sync.tsx",
      "src/components/education/quiz-attempt-history-sync.tsx",
      "src/components/education/quiz-player.tsx",
      "src/components/education/study-activity-sync.tsx",
    ];

    for (const relativePath of sharedSyncFiles) {
      const source = readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
      expect(source, `${relativePath} must not call Clerk useAuth directly`).not.toContain("useAuth(");
    }

    const authRuntimeProvider = readFileSync(
      path.resolve(process.cwd(), "src/components/providers/learner-auth-runtime-provider.tsx"),
      "utf8",
    );
    expect(authRuntimeProvider).toContain("useAuth()");
  });

  it("keys shared authenticated sync effects to the actual Clerk userId", () => {
    const identitySensitiveSyncFiles = [
      "src/components/education/academic-profile-sync.tsx",
      "src/components/education/course-selection-sync.tsx",
      "src/components/education/lesson-progress-history-sync.tsx",
      "src/components/education/lesson-progress-sync.tsx",
      "src/components/education/quiz-attempt-history-sync.tsx",
      "src/components/education/study-activity-sync.tsx",
    ];

    for (const relativePath of identitySensitiveSyncFiles) {
      const source = readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
      expect(source, `${relativePath} must consume actual userId changes`).toContain("userId");
    }
  });

  it("does not enable authenticated Convex calls before Clerk auth readiness on the client", () => {
    const authEnvironment = { mode: "clerk-convex-ready" as const, canRunConvexSync: true };

    expect(
      resolveConvexLearnerIdentity({ authEnvironment, localIdentity: null, isAuthenticated: false }),
    ).toBeNull();

    expect(
      resolveConvexLearnerIdentity({ authEnvironment, localIdentity: null, isAuthenticated: true }),
    ).toEqual({ source: "authenticated-convex", isAuthenticatedCall: true });
  });

  it("preserves anonymous migration-source state when authenticated cache data is cleared", () => {
    createLearnerSession({
      name: "Local learner",
      email: "local@example.com",
      role: "student",
    });
    saveAcademicProfile(profile);
    saveCourseSelection({
      selectedCourseIds: ["math-1"],
      selectedAt: 1,
      gracePeriodEndsAt: 2,
      lockedAt: null,
      locked: false,
    });
    writeQuizAttemptHistory([
      {
        quizId: "quiz-1",
        quizTitle: "Quiz 1",
        score: 1,
        totalQuestions: 1,
        percentage: 100,
        completedAt: "2026-07-10T10:00:00.000Z",
      },
    ]);
    writeLessonProgressHistory([
      {
        lessonId: "lesson-1",
        status: "in_progress",
        progress: 25,
        updatedAt: "2026-07-10T10:00:00.000Z",
      },
    ]);
    const migrationMarker = getLocalLearnerMigrationMarkerKey(
      "clerk-convex-ready",
      "learner:local@example.com",
    );
    localStorage.setItem(migrationMarker, "attempted");
    localStorage.setItem(ACTIVE_CLERK_LEARNER_USER_KEY, "user_A");

    clearAuthenticatedLearnerLocalData();

    expect(getLearnerSession()).toEqual({
      name: "Local learner",
      email: "local@example.com",
      role: "student",
    });
    expect(localStorage.getItem(LEARNER_SESSION_KEY)).not.toBeNull();
    expect(localStorage.getItem(migrationMarker)).toBe("attempted");
    expect(localStorage.getItem(ACTIVE_CLERK_LEARNER_USER_KEY)).toBe("user_A");
    expect(localStorage.getItem(ACADEMIC_PROFILE_KEY)).toBeNull();
    expect(localStorage.getItem(COURSE_SELECTION_KEY)).toBeNull();
    expect(localStorage.getItem(QUIZ_ATTEMPT_HISTORY_KEY)).toBeNull();
    expect(localStorage.getItem(LESSON_PROGRESS_HISTORY_KEY)).toBeNull();
  });

  it("does not treat an already completed local migration source as pending forever", () => {
    createLearnerSession({
      name: "Local learner",
      email: "local@example.com",
      role: "student",
    });

    expect(hasPendingLocalLearnerMigrationSource()).toBe(true);

    const markerKey = getLocalLearnerMigrationMarkerKey(
      "local-fallback",
      "learner:local@example.com",
    );
    localStorage.setItem(markerKey, "succeeded");

    expect(hasPendingLocalLearnerMigrationSource()).toBe(false);
  });

  it("separates signed-out state, first login, same-account reuse, and direct account switching", () => {
    expect(
      shouldClearAuthenticatedLearnerLocalDataForTransition({
        previousUserId: "user_A",
        nextUserId: null,
        hasMigrationSource: false,
      }),
    ).toBe(false);

    expect(
      shouldClearAuthenticatedLearnerLocalDataForTransition({
        previousUserId: null,
        nextUserId: "user_A",
        hasMigrationSource: false,
      }),
    ).toBe(true);

    expect(
      shouldClearAuthenticatedLearnerLocalDataForTransition({
        previousUserId: null,
        nextUserId: "user_A",
        hasMigrationSource: true,
      }),
    ).toBe(false);

    expect(
      shouldClearAuthenticatedLearnerLocalDataForTransition({
        previousUserId: "user_A",
        nextUserId: "user_A",
        hasMigrationSource: false,
      }),
    ).toBe(false);

    expect(
      shouldClearAuthenticatedLearnerLocalDataForTransition({
        previousUserId: "user_A",
        nextUserId: "user_B",
        hasMigrationSource: false,
      }),
    ).toBe(true);
  });

  it("keeps new Clerk signup on mandatory Study Profile onboarding while login returns to courses", () => {
    expect(CLERK_SIGNUP_REDIRECT_URL).toBe("/onboarding");
    expect(CLERK_LOGIN_REDIRECT_URL).toBe("/courses");
  });
});
