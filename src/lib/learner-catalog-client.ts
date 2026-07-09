"use client";

import { courses as staticCourses, getCourse, type Course } from "@/data/courses";
import { getLesson, lessons as staticLessons, type Lesson } from "@/data/lessons";
import { getQuiz, quizzes as staticQuizzes, type Quiz } from "@/data/quizzes";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import {
  normalizeLearnerCourse,
  normalizeLearnerLesson,
  normalizeLearnerQuiz,
  type ConvexCourseRecord,
  type ConvexLessonRecord,
  type ConvexQuizRecord,
} from "@/lib/learner-catalog";
import { useQuery } from "convex/react";
import { useMemo } from "react";

export type LearnerCatalog = {
  courses: Course[];
  lessons: Lesson[];
  quizzes: Quiz[];
  courseById: Map<string, Course>;
  lessonById: Map<string, Lesson>;
  quizById: Map<string, Quiz>;
  isLive: boolean;
};

export function buildLearnerCatalog(input?: {
  convexCourses?: ConvexCourseRecord[] | null;
  convexLessons?: ConvexLessonRecord[] | null;
  convexQuizzes?: ConvexQuizRecord[] | null;
}): LearnerCatalog {
  const normalizedCourses =
    input?.convexCourses?.map((course) => normalizeLearnerCourse(course, getCourse(course.stableId))).filter(Boolean) ??
    staticCourses;
  const courses = normalizedCourses as Course[];
  const initialCourseById = new Map(courses.map((course) => [course.id, course]));

  const normalizedQuizzes =
    input?.convexQuizzes
      ?.map((quiz) =>
        normalizeLearnerQuiz(quiz, {
          course: initialCourseById.get(quiz.courseStableId) ?? null,
          fallback: getQuiz(quiz.stableId),
        }),
      )
      .filter(Boolean) ?? staticQuizzes;
  const quizzes = normalizedQuizzes as Quiz[];
  const quizzesByCourseId = new Map<string, ConvexQuizRecord[]>();

  for (const quiz of input?.convexQuizzes ?? []) {
    const courseQuizzes = quizzesByCourseId.get(quiz.courseStableId) ?? [];
    courseQuizzes.push(quiz);
    quizzesByCourseId.set(quiz.courseStableId, courseQuizzes);
  }

  const lessonsByCourseId = new Map<string, ConvexLessonRecord[]>();

  for (const lesson of input?.convexLessons ?? []) {
    const courseLessons = lessonsByCourseId.get(lesson.courseStableId) ?? [];
    courseLessons.push(lesson);
    lessonsByCourseId.set(lesson.courseStableId, courseLessons);
  }

  const normalizedLessons =
    input?.convexLessons
      ?.map((lesson) =>
        normalizeLearnerLesson(lesson, {
          course: initialCourseById.get(lesson.courseStableId) ?? null,
          lessons: lessonsByCourseId.get(lesson.courseStableId),
          quizzes: quizzesByCourseId.get(lesson.courseStableId),
          fallback: getLesson(lesson.stableId),
        }),
      )
      .filter(Boolean) ?? staticLessons;
  const lessons = normalizedLessons as Lesson[];
  const coursesWithRelationships = courses.map((course) => ({
    ...course,
    lessonIds:
      input?.convexLessons === undefined
        ? course.lessonIds
        : lessons.filter((lesson) => lesson.courseId === course.id).map((lesson) => lesson.id),
    quizIds:
      input?.convexQuizzes === undefined
        ? course.quizIds
        : quizzes.filter((quiz) => quiz.courseId === course.id).map((quiz) => quiz.id),
  }));

  return {
    courses: coursesWithRelationships,
    lessons,
    quizzes,
    courseById: new Map(coursesWithRelationships.map((course) => [course.id, course])),
    lessonById: new Map(lessons.map((lesson) => [lesson.id, lesson])),
    quizById: new Map(quizzes.map((quiz) => [quiz.id, quiz])),
    isLive: Boolean(input?.convexCourses || input?.convexLessons || input?.convexQuizzes),
  };
}

export function useLearnerCatalog() {
  const convexCourses = useQuery(convexApi.courses.listCourses, convexEnv.isConfigured ? {} : "skip");
  const convexLessons = useQuery(convexApi.lessons.listLessons, convexEnv.isConfigured ? {} : "skip");
  const convexQuizzes = useQuery(convexApi.quizzes.listQuizzes, convexEnv.isConfigured ? {} : "skip");

  return useMemo(() => {
    if (!convexEnv.isConfigured || !convexCourses || !convexLessons || !convexQuizzes) {
      return buildLearnerCatalog();
    }

    return buildLearnerCatalog({
      convexCourses: convexCourses as ConvexCourseRecord[],
      convexLessons: convexLessons as ConvexLessonRecord[],
      convexQuizzes: convexQuizzes as ConvexQuizRecord[],
    });
  }, [convexCourses, convexLessons, convexQuizzes]);
}
