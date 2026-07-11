export const DRAFT = "draft" as const;
export const SUBMITTED_FOR_REVIEW = "submitted_for_review" as const;
export const CHANGES_REQUESTED = "changes_requested" as const;
export const APPROVED = "approved" as const;
export const PUBLISHED = "published" as const;
export const UNPUBLISHED = "unpublished" as const;
export const ARCHIVED = "archived" as const;

export type InstructorCourseStatus =
  | typeof DRAFT
  | typeof SUBMITTED_FOR_REVIEW
  | typeof CHANGES_REQUESTED
  | typeof APPROVED
  | typeof PUBLISHED
  | typeof UNPUBLISHED
  | typeof ARCHIVED;

export type InstructorLessonDraft = {
  stableId: string;
  title: string;
  duration: string;
  summary: string;
  content: string[];
  videoUrl?: string;
  posterUrl?: string;
};

export type InstructorQuizQuestionDraft = {
  stableId: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

export type InstructorQuizDraft = {
  stableId: string;
  lessonStableId?: string;
  title: string;
  difficulty: string;
  estimatedTime: string;
  questions: InstructorQuizQuestionDraft[];
};

export type InstructorCourseDraft = {
  stableId: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  duration: string;
  accent: string;
  reviewStatus?: InstructorCourseStatus;
  publicationStatus?: InstructorCourseStatus;
  reviewReason?: string;
  submittedAt?: number;
  reviewedAt?: number;
  updatedAt?: number;
  lessons: InstructorLessonDraft[];
  quizzes: InstructorQuizDraft[];
};

export type InstructorCourseSummary = {
  stableId: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  duration: string;
  accent: string;
  reviewStatus?: InstructorCourseStatus;
  publicationStatus?: InstructorCourseStatus;
  reviewReason?: string;
  submittedAt?: number;
  reviewedAt?: number;
  updatedAt: number;
  lessonCount: number;
  quizCount: number;
};

export const instructorCourseStatusLabels: Record<InstructorCourseStatus, string> = {
  draft: "Draft",
  submitted_for_review: "Under review",
  changes_requested: "Changes requested",
  approved: "Approved",
  published: "Published",
  unpublished: "Unpublished",
  archived: "Archived",
};

export const instructorCourseStatusTone: Record<InstructorCourseStatus, string> = {
  draft: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  submitted_for_review: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  changes_requested: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  approved: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  published: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  unpublished: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  archived: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

export function resolveInstructorCourseStatus(course: {
  reviewStatus?: InstructorCourseStatus;
  publicationStatus?: InstructorCourseStatus;
}): InstructorCourseStatus {
  if (course.publicationStatus === PUBLISHED || course.publicationStatus === ARCHIVED) {
    return course.publicationStatus;
  }

  return course.reviewStatus ?? DRAFT;
}

export function isInstructorCourseEditable(course: { reviewStatus?: InstructorCourseStatus }) {
  return course.reviewStatus === DRAFT || course.reviewStatus === CHANGES_REQUESTED;
}

export function isInstructorLearnerPreviewAvailable(course: {
  reviewStatus?: InstructorCourseStatus;
  publicationStatus?: InstructorCourseStatus;
}) {
  return course.reviewStatus === APPROVED && course.publicationStatus === PUBLISHED;
}

export function slugifyInstructorCourseTitle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function createInstructorStableId(prefix: "course" | "lesson" | "quiz" | "question") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlankInstructorCourseDraft(): InstructorCourseDraft {
  return {
    stableId: createInstructorStableId("course"),
    slug: "",
    title: "",
    description: "",
    subject: "",
    level: "",
    duration: "",
    accent: "from-slate-500 to-slate-700",
    reviewStatus: DRAFT,
    publicationStatus: UNPUBLISHED,
    lessons: [],
    quizzes: [],
  };
}

export function formatInstructorWorkspaceDate(value?: number) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
