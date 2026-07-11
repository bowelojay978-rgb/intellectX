"use client";

import {
  clearAcademicProfile,
  saveAcademicProfile,
  type AcademicProfile,
} from "@/lib/academic-profile";
import {
  clearCourseSelection,
  saveCourseSelection,
  type CourseSelection,
} from "@/lib/course-selection";
import {
  writeLessonProgressHistory,
  type LessonProgressHistoryItem,
} from "@/lib/lesson-progress-history";
import {
  writeQuizAttemptHistory,
  type QuizAttemptHistoryItem,
} from "@/lib/quiz-attempt-history";

export type AuthenticatedHydrationResult = "deferred-for-migration" | "replaced" | "cleared";

export function hydrateAuthenticatedAcademicProfile(
  remoteProfile: AcademicProfile | null,
  hasPendingMigrationSource: boolean,
): AuthenticatedHydrationResult {
  if (hasPendingMigrationSource) {
    return "deferred-for-migration";
  }

  if (remoteProfile) {
    saveAcademicProfile(remoteProfile);
    return "replaced";
  }

  clearAcademicProfile();
  return "cleared";
}

export function hydrateAuthenticatedCourseSelection(
  remoteSelection: CourseSelection | null,
  hasPendingMigrationSource: boolean,
): AuthenticatedHydrationResult {
  if (hasPendingMigrationSource) {
    return "deferred-for-migration";
  }

  if (remoteSelection) {
    saveCourseSelection(remoteSelection);
    return "replaced";
  }

  clearCourseSelection();
  return "cleared";
}

export function hydrateAuthenticatedQuizAttemptHistory(
  remoteAttempts: QuizAttemptHistoryItem[],
  hasPendingMigrationSource: boolean,
): AuthenticatedHydrationResult {
  if (hasPendingMigrationSource) {
    return "deferred-for-migration";
  }

  writeQuizAttemptHistory(remoteAttempts);
  return "replaced";
}

export function hydrateAuthenticatedLessonProgressHistory(
  remoteItems: LessonProgressHistoryItem[],
  hasPendingMigrationSource: boolean,
): AuthenticatedHydrationResult {
  if (hasPendingMigrationSource) {
    return "deferred-for-migration";
  }

  writeLessonProgressHistory(remoteItems);
  return "replaced";
}
