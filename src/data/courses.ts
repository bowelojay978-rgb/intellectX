import type { ContentAccessLevel } from "../lib/entitlements";
import {
  APPROVED,
  PUBLISHED,
  filterLearnerVisibleCourses,
  findLearnerVisibleCourse,
  type CourseWorkflowState,
} from "../lib/course-workflow-policy";

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export type Course = CourseWorkflowState & {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  level: CourseLevel;
  duration: string;
  progress: number;
  lessonIds: string[];
  quizIds: string[];
  accent: string;
  accessLevel?: ContentAccessLevel;
};

const courseRecords: Course[] = [
  {
    id: "ai-study-systems",
    slug: "ai-study-systems",
    title: "AI Study Systems",
    description: "Build a reliable study workflow with AI tutors, retrieval practice, and weekly planning.",
    subject: "AI Productivity",
    level: "Beginner",
    duration: "4h 20m",
    progress: 68,
    lessonIds: ["prompting-for-learning", "memory-systems", "weekly-review"],
    quizIds: ["ai-study-systems-check"],
    accent: "from-sky-500/20 via-white to-emerald-400/20",
    reviewStatus: APPROVED,
    publicationStatus: PUBLISHED,
  },
  {
    id: "critical-thinking",
    slug: "critical-thinking",
    title: "Critical Thinking Lab",
    description: "Practice evidence checks, argument mapping, and bias detection with guided AI feedback.",
    subject: "Reasoning",
    level: "Intermediate",
    duration: "5h 10m",
    progress: 42,
    lessonIds: ["argument-maps", "source-quality", "counterexamples"],
    quizIds: ["critical-thinking-check"],
    accent: "from-violet-500/20 via-white to-amber-300/20",
    reviewStatus: APPROVED,
    publicationStatus: PUBLISHED,
  },
  {
    id: "exam-accelerator",
    slug: "exam-accelerator",
    title: "Exam Accelerator",
    description: "Turn course notes into adaptive revision plans, timed drills, and confidence tracking.",
    subject: "Exam Prep",
    level: "Advanced",
    duration: "6h 45m",
    progress: 24,
    lessonIds: ["diagnostic-review", "active-recall", "timed-practice"],
    quizIds: ["exam-accelerator-check"],
    accent: "from-rose-400/20 via-white to-cyan-400/20",
    reviewStatus: APPROVED,
    publicationStatus: PUBLISHED,
  },
];

export const courses = filterLearnerVisibleCourses(courseRecords);

export function getCourse(id: string) {
  return findLearnerVisibleCourse(courses, id);
}

export function listLearnerVisibleCourses() {
  return filterLearnerVisibleCourses(courses);
}
