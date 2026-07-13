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
  readLessonProgressHistory,
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

function toTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function mergeLessonProgressWithoutRegression(
  remoteItems: LessonProgressHistoryItem[],
  localItemsRecordedAfterRequest: LessonProgressHistoryItem[],
) {
  const mergedByLessonId = new Map(remoteItems.map((item) => [item.lessonId, item]));

  for (const localItem of localItemsRecordedAfterRequest) {
    const remoteItem = mergedByLessonId.get(localItem.lessonId);

    if (!remoteItem) {
      mergedByLessonId.set(localItem.lessonId, localItem);
      continue;
    }

    const latestItem = toTimestamp(localItem.updatedAt) >= toTimestamp(remoteItem.updatedAt) ? localItem : remoteItem;
    const progress = Math.max(remoteItem.progress, localItem.progress);
    const completed =
      progress >= 100 || remoteItem.status === "completed" || localItem.status === "completed";

    mergedByLessonId.set(localItem.lessonId, {
      ...latestItem,
      lessonTitle: latestItem.lessonTitle ?? remoteItem.lessonTitle ?? localItem.lessonTitle,
      status: completed ? "completed" : latestItem.status,
      progress: completed ? 100 : progress,
    });
  }

  return [...mergedByLessonId.values()];
}

export function hydrateAuthenticatedLessonProgressHistory(
  remoteItems: LessonProgressHistoryItem[],
  hasPendingMigrationSource: boolean,
  remoteRequestedAt?: number,
): AuthenticatedHydrationResult {
  if (hasPendingMigrationSource) {
    return "deferred-for-migration";
  }

  if (remoteRequestedAt === undefined) {
    writeLessonProgressHistory(remoteItems);
    return "replaced";
  }

  const localItemsRecordedAfterRequest = readLessonProgressHistory().filter(
    (item) => toTimestamp(item.updatedAt) >= remoteRequestedAt,
  );
  const mergedItems = mergeLessonProgressWithoutRegression(remoteItems, localItemsRecordedAfterRequest);

  writeLessonProgressHistory(mergedItems);
  return "replaced";
}
