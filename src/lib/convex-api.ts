import { makeFunctionReference } from "convex/server";

export const convexApi = {
  courses: {
    listCourses: makeFunctionReference<"query">("courses:listCourses"),
    getCourseBySlug: makeFunctionReference<"query">("courses:getCourseBySlug"),
  },
  lessons: {
    getLessonsByCourse: makeFunctionReference<"query">("lessons:getLessonsByCourse"),
    getLessonById: makeFunctionReference<"query">("lessons:getLessonById"),
    updateLessonProgress: makeFunctionReference<"mutation">("lessons:updateLessonProgress"),
  },
  quizzes: {
    listQuizzes: makeFunctionReference<"query">("quizzes:listQuizzes"),
    getQuizById: makeFunctionReference<"query">("quizzes:getQuizById"),
    submitQuizAttempt: makeFunctionReference<"mutation">("quizzes:submitQuizAttempt"),
  },
  notes: {
    upsertLessonNote: makeFunctionReference<"mutation">("notes:upsertLessonNote"),
  },
  seed: {
    seedEducationCatalog: makeFunctionReference<"mutation">("seed:seedEducationCatalog"),
  },
};
