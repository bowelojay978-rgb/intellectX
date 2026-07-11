import type { LessonProgressHistoryItem } from "@/lib/lesson-progress-history";

export type CourseContinueTarget = {
  lessonId: string;
  label: "Start learning" | "Continue learning" | "Review course";
};

export function isLessonProgressCompleted(item: LessonProgressHistoryItem | undefined) {
  return Boolean(item && (item.progress >= 100 || item.status === "completed"));
}

export function calculateCourseProgress(lessonIds: string[], history: LessonProgressHistoryItem[]) {
  if (lessonIds.length === 0) return 0;

  const progressByLessonId = new Map(history.map((item) => [item.lessonId, item.progress]));
  const totalProgress = lessonIds.reduce((total, lessonId) => total + (progressByLessonId.get(lessonId) ?? 0), 0);

  return Math.round(totalProgress / lessonIds.length);
}

export function getCourseContinueTarget(
  lessons: { id: string }[],
  history: LessonProgressHistoryItem[],
): CourseContinueTarget | null {
  if (lessons.length === 0) return null;

  const progressByLessonId = new Map(history.map((item) => [item.lessonId, item]));
  const allCompleted = lessons.every((lesson) => isLessonProgressCompleted(progressByLessonId.get(lesson.id)));

  if (allCompleted) {
    return { lessonId: lessons[lessons.length - 1].id, label: "Review course" };
  }

  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const latestActivity = history
    .filter((item) => lessonIds.has(item.lessonId))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0];

  if (!latestActivity) {
    return { lessonId: lessons[0].id, label: "Start learning" };
  }

  if (!isLessonProgressCompleted(latestActivity)) {
    return { lessonId: latestActivity.lessonId, label: "Continue learning" };
  }

  const latestIndex = lessons.findIndex((lesson) => lesson.id === latestActivity.lessonId);
  const nextIncomplete = lessons
    .slice(Math.max(latestIndex + 1, 0))
    .find((lesson) => !isLessonProgressCompleted(progressByLessonId.get(lesson.id)));
  const firstIncomplete = lessons.find((lesson) => !isLessonProgressCompleted(progressByLessonId.get(lesson.id)));
  const target = nextIncomplete ?? firstIncomplete ?? lessons[0];

  return { lessonId: target.id, label: "Continue learning" };
}
