import { instructorWorkspaceCourses, type InstructorCourseDraft } from "@/lib/instructor-ui-data";

export type AdminInstructorStatus = "active" | "pending" | "paused";
export type AdminReviewPriority = "standard" | "high";

export type AdminInstructor = {
  id: string;
  name: string;
  email: string;
  initials: string;
  status: AdminInstructorStatus;
  subjects: string[];
  joinedAt: string;
  lastActiveAt: string;
  publishedCourses: number;
  coursesInReview: number;
  learnerReach: number;
};

export type AdminCourseReview = {
  id: string;
  course: InstructorCourseDraft;
  instructorId: string;
  submittedAt: string;
  priority: AdminReviewPriority;
  reviewerNote: string;
  checklist: {
    label: string;
    ready: boolean;
  }[];
};

export const adminInstructorStatusLabels: Record<AdminInstructorStatus, string> = {
  active: "Active",
  pending: "Pending",
  paused: "Paused",
};

export const adminInstructors: AdminInstructor[] = [
  {
    id: "instructor-amina-molefe",
    name: "Amina Molefe",
    email: "amina@intellectx.example",
    initials: "AM",
    status: "active",
    subjects: ["Reasoning", "AI Productivity"],
    joinedAt: "2026-05-12T09:00:00.000Z",
    lastActiveAt: "2026-07-10T15:20:00.000Z",
    publishedCourses: 1,
    coursesInReview: 1,
    learnerReach: 1240,
  },
  {
    id: "instructor-thato-kgosi",
    name: "Thato Kgosi",
    email: "thato@intellectx.example",
    initials: "TK",
    status: "active",
    subjects: ["Exam Prep", "Mathematics"],
    joinedAt: "2026-04-28T12:30:00.000Z",
    lastActiveAt: "2026-07-09T08:45:00.000Z",
    publishedCourses: 1,
    coursesInReview: 0,
    learnerReach: 980,
  },
  {
    id: "instructor-kagiso-ndlovu",
    name: "Kagiso Ndlovu",
    email: "kagiso@intellectx.example",
    initials: "KN",
    status: "pending",
    subjects: ["Biology"],
    joinedAt: "2026-07-08T10:15:00.000Z",
    lastActiveAt: "2026-07-08T10:15:00.000Z",
    publishedCourses: 0,
    coursesInReview: 0,
    learnerReach: 0,
  },
  {
    id: "instructor-lebo-segokgo",
    name: "Lebo Segokgo",
    email: "lebo@intellectx.example",
    initials: "LS",
    status: "active",
    subjects: ["Chemistry"],
    joinedAt: "2026-03-19T07:40:00.000Z",
    lastActiveAt: "2026-07-07T18:10:00.000Z",
    publishedCourses: 0,
    coursesInReview: 0,
    learnerReach: 320,
  },
  {
    id: "instructor-naledi-moyo",
    name: "Naledi Moyo",
    email: "naledi@intellectx.example",
    initials: "NM",
    status: "paused",
    subjects: ["Study Skills"],
    joinedAt: "2026-02-14T11:25:00.000Z",
    lastActiveAt: "2026-06-20T13:35:00.000Z",
    publishedCourses: 0,
    coursesInReview: 0,
    learnerReach: 145,
  },
];

const criticalThinkingCourse = instructorWorkspaceCourses.find((course) => course.id === "critical-thinking");

export const adminCourseReviews: AdminCourseReview[] = criticalThinkingCourse
  ? [
      {
        id: "review-critical-thinking-v1",
        course: criticalThinkingCourse,
        instructorId: "instructor-amina-molefe",
        submittedAt: "2026-07-08T09:15:00.000Z",
        priority: "high",
        reviewerNote: "Check quiz coverage and confirm the source-quality lesson has a complete learner practice loop.",
        checklist: [
          { label: "Course title and description are complete", ready: true },
          { label: "At least one lesson is available", ready: true },
          { label: "Lesson summaries are complete", ready: true },
          { label: "Quiz or knowledge check is included", ready: false },
          { label: "Learner preview content is ready", ready: false },
        ],
      },
    ]
  : [];

export function getAdminInstructor(instructorId: string) {
  return adminInstructors.find((instructor) => instructor.id === instructorId) ?? null;
}

export function getAdminCourseReview(reviewId: string) {
  return adminCourseReviews.find((review) => review.id === reviewId) ?? null;
}
