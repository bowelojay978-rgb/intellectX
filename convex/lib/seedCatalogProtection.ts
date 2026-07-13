export type SeedCatalogTable = "courses" | "lessons" | "quizzes" | "questions";

type SeedCatalogRecord = {
  instructorId?: string;
  courseStableId?: string;
  quizStableId?: string;
};

export function shouldPreserveInstructorAuthoredCatalogDoc(
  table: SeedCatalogTable,
  record: SeedCatalogRecord,
  instructorCourseStableIds: ReadonlySet<string>,
  instructorQuizStableIds: ReadonlySet<string>,
) {
  if (table === "courses") {
    return Boolean(record.instructorId);
  }

  if (table === "lessons" || table === "quizzes") {
    return Boolean(record.courseStableId && instructorCourseStableIds.has(record.courseStableId));
  }

  return Boolean(record.quizStableId && instructorQuizStableIds.has(record.quizStableId));
}
