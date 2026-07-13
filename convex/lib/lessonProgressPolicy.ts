export const IN_PROGRESS = "in_progress" as const;
export const COMPLETED = "completed" as const;

export type LessonProgressStatus = typeof IN_PROGRESS | typeof COMPLETED;

type NormalizeLessonProgressWriteArgs = {
  requestedStatus: LessonProgressStatus;
  requestedProgress: number;
  existingProgress?: number;
};

export function normalizeLessonProgressWrite({
  requestedStatus,
  requestedProgress,
  existingProgress = 0,
}: NormalizeLessonProgressWriteArgs) {
  if (!Number.isFinite(requestedProgress)) {
    throw new Error("Lesson progress must be a finite number.");
  }

  const boundedRequestedProgress = Math.min(Math.max(requestedProgress, 0), 100);

  if (requestedStatus === COMPLETED && boundedRequestedProgress < 100) {
    throw new Error("Completed lesson progress must be 100 percent.");
  }

  const progress = Math.max(existingProgress, boundedRequestedProgress);

  return {
    progress,
    status: progress >= 100 ? COMPLETED : IN_PROGRESS,
  } as const;
}
