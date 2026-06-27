import { courses, getCourse } from "@/data/courses";
import { getLesson, getLessonsByCourse, lessons } from "@/data/lessons";
import { getQuiz, getQuizzesByCourse, quizzes } from "@/data/quizzes";
import { userProgress } from "@/data/user-progress";

export const convexEnv = {
  url: process.env.NEXT_PUBLIC_CONVEX_URL,
  isConfigured: Boolean(process.env.NEXT_PUBLIC_CONVEX_URL),
};

export const educationData = {
  listCourses: () => courses,
  getCourseBySlug: getCourse,
  getLessonsByCourse,
  getLessonById: getLesson,
  listQuizzes: () => quizzes,
  getQuizById: getQuiz,
  getQuizzesByCourse,
  getDashboardSummary: () => {
    const enrolledCourses = courses.filter((course) => userProgress.enrolledCourseIds.includes(course.id));
    const recentLessons = lessons.filter((lesson) => userProgress.recentLessonIds.includes(lesson.id));

    return {
      user: userProgress,
      enrolledCourses,
      recentLessons,
      quizzes,
    };
  },
  getProgressSummary: () => {
    const overallCompletion = Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length);
    const completedLessons = Math.round(lessons.length * (overallCompletion / 100));
    const weakAreas = courses
      .filter((course) => course.progress < 50)
      .map((course) => `${course.subject}: continue ${course.title}`);

    return {
      overallCompletion,
      completedLessons,
      totalLessons: lessons.length,
      courses,
      quizzes,
      user: userProgress,
      weakAreas,
      nextFocus: weakAreas[0] ?? "Keep your streak alive with one knowledge check today.",
    };
  },
  getProfileLearningSummary: () => ({
    user: userProgress,
    enrolledCourses: courses.filter((course) => userProgress.enrolledCourseIds.includes(course.id)),
  }),
};

export type EducationData = typeof educationData;
