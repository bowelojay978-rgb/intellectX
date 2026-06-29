import { makeFunctionReference } from "convex/server";

export const convexApi = {
  courses: {
    listCourses: makeFunctionReference<"query">("courses:listCourses"),
    getCourseBySlug: makeFunctionReference<"query">("courses:getCourseBySlug"),
  },
  courseSelections: {
    getCourseSelection: makeFunctionReference<"query">("courseSelections:getCourseSelection"),
    upsertCourseSelection: makeFunctionReference<"mutation">("courseSelections:upsertCourseSelection"),
  },
  academicProfiles: {
    getAcademicProfile: makeFunctionReference<"query">("academicProfiles:getAcademicProfile"),
    upsertAcademicProfile: makeFunctionReference<"mutation">("academicProfiles:upsertAcademicProfile"),
    clearAcademicProfile: makeFunctionReference<"mutation">("academicProfiles:clearAcademicProfile"),
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
    getLessonNote: makeFunctionReference<"query">("notes:getLessonNote"),
    upsertLessonNote: makeFunctionReference<"mutation">("notes:upsertLessonNote"),
  },
  aiTutor: {
    getLessonTutor: makeFunctionReference<"action">("aiTutor:getLessonTutor"),
  },
  seed: {
    seedEducationCatalog: makeFunctionReference<"mutation">("seed:seedEducationCatalog"),
  },
};

