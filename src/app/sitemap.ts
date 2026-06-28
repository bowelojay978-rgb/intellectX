import { courses } from "@/data/courses";
import { lessons } from "@/data/lessons";
import { quizzes } from "@/data/quizzes";
import type { MetadataRoute } from "next";

const siteUrl = "https://intellect-x-coral.vercel.app";

const staticRoutes = [
  "/",
  "/courses",
  "/quizzes",
  "/dashboard",
  "/progress",
  "/profile",
  "/pricing",
  "/login",
  "/signup",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ...staticRoutes,
    ...courses.map((course) => `/courses/${course.id}`),
    ...lessons.map((lesson) => `/learn/${lesson.id}`),
    ...quizzes.map((quiz) => `/quiz/${quiz.id}`),
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));
}
