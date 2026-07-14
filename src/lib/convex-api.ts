import { makeFunctionReference } from "convex/server";

export const convexApi = {
  courses: {
    listCourses: makeFunctionReference<"query">("courses:listCourses"),
    getCourseBySlug: makeFunctionReference<"query">("courses:getCourseBySlug"),
    getCourseByStableId: makeFunctionReference<"query">("courses:getCourseByStableId"),
    listInstructorCourses: makeFunctionReference<"query">("courses:listInstructorCourses"),
    getInstructorCourseDraft: makeFunctionReference<"query">("courses:getInstructorCourseDraft"),
    createInstructorCourseDraft: makeFunctionReference<"mutation">("courses:createInstructorCourseDraft"),
    saveInstructorCourseDraft: makeFunctionReference<"mutation">("courses:saveInstructorCourseDraft"),
    submitCourseForReview: makeFunctionReference<"mutation">("courses:submitCourseForReview"),
    requestCourseChanges: makeFunctionReference<"mutation">("courses:requestCourseChanges"),
    approveCourse: makeFunctionReference<"mutation">("courses:approveCourse"),
    publishCourse: makeFunctionReference<"mutation">("courses:publishCourse"),
    unpublishCourse: makeFunctionReference<"mutation">("courses:unpublishCourse"),
    archiveCourse: makeFunctionReference<"mutation">("courses:archiveCourse"),
  },
  adminCourses: {
    listAdminCourses: makeFunctionReference<"query">("adminCourses:listAdminCourses"),
    getAdminCourseReview: makeFunctionReference<"query">("adminCourses:getAdminCourseReview"),
  },
  staffMedia: {
    generateStaffMediaUploadUrl: makeFunctionReference<"mutation">("staffMedia:generateStaffMediaUploadUrl"),
    registerStaffMediaUpload: makeFunctionReference<"mutation">("staffMedia:registerStaffMediaUpload"),
    listInstructorLessonMedia: makeFunctionReference<"query">("staffMedia:listInstructorLessonMedia"),
    attachLessonMedia: makeFunctionReference<"mutation">("staffMedia:attachLessonMedia"),
    removeLessonMedia: makeFunctionReference<"mutation">("staffMedia:removeLessonMedia"),
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
    listLessons: makeFunctionReference<"query">("lessons:listLessons"),
    getLessonsByCourse: makeFunctionReference<"query">("lessons:getLessonsByCourse"),
    getLessonById: makeFunctionReference<"query">("lessons:getLessonById"),
    updateLessonProgress: makeFunctionReference<"mutation">("lessons:updateLessonProgress"),
  },
  studyStats: {
    updateStudyStats: makeFunctionReference<"mutation">("studyStats:updateStudyStats"),
  },
  progress: {
    getDashboardSummary: makeFunctionReference<"query">("progress:getDashboardSummary"),
    getProgressSummary: makeFunctionReference<"query">("progress:getProgressSummary"),
    getProfileLearningSummary: makeFunctionReference<"query">("progress:getProfileLearningSummary"),
  },
  quizzes: {
    listQuizzes: makeFunctionReference<"query">("quizzes:listQuizzes"),
    getQuizzesByCourse: makeFunctionReference<"query">("quizzes:getQuizzesByCourse"),
    getQuizById: makeFunctionReference<"query">("quizzes:getQuizById"),
    getQuizAttempts: makeFunctionReference<"query">("quizzes:getQuizAttempts"),
    submitQuizAttempt: makeFunctionReference<"mutation">("quizzes:submitQuizAttempt"),
  },
  notes: {
    getLessonNote: makeFunctionReference<"query">("notes:getLessonNote"),
    upsertLessonNote: makeFunctionReference<"mutation">("notes:upsertLessonNote"),
  },
  learnerMigration: {
    recordLocalLearnerMigrationAttempt: makeFunctionReference<"mutation">(
      "learnerMigration:recordLocalLearnerMigrationAttempt",
    ),
    recordLocalLearnerMigrationFailure: makeFunctionReference<"mutation">(
      "learnerMigration:recordLocalLearnerMigrationFailure",
    ),
    migrateLocalLearnerDataToAuthenticatedAccount: makeFunctionReference<"mutation">(
      "learnerMigration:migrateLocalLearnerDataToAuthenticatedAccount",
    ),
  },
  entitlements: {
    getPaidAccessDecision: makeFunctionReference<"query">("entitlements:getPaidAccessDecision"),
  },
  aiTutor: {
    getLessonTutor: makeFunctionReference<"action">("aiTutor:getLessonTutor"),
  },
};
