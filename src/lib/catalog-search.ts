import type { LearnerCatalog } from "@/lib/learner-catalog-client";

function matchesSearch(query: string, values: Array<string | string[] | undefined>) {
  const searchableText = values.flatMap((value) => (Array.isArray(value) ? value : [value ?? ""])).join(" ").toLowerCase();
  return query.split(/\s+/).filter(Boolean).every((term) => searchableText.includes(term));
}

export function searchLearnerCatalog(catalog: LearnerCatalog, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return { courses: [], lessons: [], quizzes: [] };

  return {
    courses: catalog.courses.filter((course) =>
      matchesSearch(normalizedQuery, [course.title, course.subject, course.description, course.level]),
    ),
    lessons: catalog.lessons.filter((lesson) =>
      matchesSearch(normalizedQuery, [lesson.title, lesson.summary, lesson.content]),
    ),
    quizzes: catalog.quizzes.filter((quiz) =>
      matchesSearch(normalizedQuery, [quiz.title, quiz.difficulty, catalog.courseById.get(quiz.courseId)?.title]),
    ),
  };
}
