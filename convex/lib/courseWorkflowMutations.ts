import type { StaffRole } from "./staffRbac";

export const DRAFT = "draft" as const;
export const SUBMITTED_FOR_REVIEW = "submitted_for_review" as const;
export const CHANGES_REQUESTED = "changes_requested" as const;
export const APPROVED = "approved" as const;
export const PUBLISHED = "published" as const;
export const UNPUBLISHED = "unpublished" as const;
export const ARCHIVED = "archived" as const;

export type CourseStatus =
  | typeof DRAFT
  | typeof SUBMITTED_FOR_REVIEW
  | typeof CHANGES_REQUESTED
  | typeof APPROVED
  | typeof PUBLISHED
  | typeof UNPUBLISHED
  | typeof ARCHIVED;

export type CourseWorkflowRecord = {
  _id?: unknown;
  stableId?: string;
  slug?: string;
  title?: string;
  reviewStatus?: CourseStatus;
  publicationStatus?: CourseStatus;
  instructorId?: string;
  submittedAt?: number;
  reviewedAt?: number;
  reviewedBy?: string;
  reviewReason?: string;
};

export type CourseWorkflowEventType =
  | "course.draft_created"
  | "course.draft_updated"
  | "course.submitted_for_review"
  | "course.changes_requested"
  | "course.approved"
  | "course.published"
  | "course.unpublished"
  | "course.archived";

export type CourseWorkflowAuditInput = {
  eventType: CourseWorkflowEventType;
  actorUserId: string;
  actorRole: StaffRole;
  targetId: string;
  createdAt: number;
  reason?: string;
  before?: CourseWorkflowRecord | null;
  after?: CourseWorkflowRecord | null;
};

export function assertCanSubmitCourseForReview(course: CourseWorkflowRecord) {
  if (course.reviewStatus !== DRAFT && course.reviewStatus !== CHANGES_REQUESTED) {
    throw new Error("Course can only be submitted from draft or changes_requested.");
  }
}

export function assertCanRequestCourseChanges(course: CourseWorkflowRecord) {
  if (course.reviewStatus !== SUBMITTED_FOR_REVIEW) {
    throw new Error("Changes can only be requested for a submitted course.");
  }
}

export function assertCanApproveCourse(course: CourseWorkflowRecord) {
  if (course.reviewStatus !== SUBMITTED_FOR_REVIEW) {
    throw new Error("Course can only be approved from submitted_for_review.");
  }
}

export function assertCanPublishCourse(course: CourseWorkflowRecord) {
  if (course.reviewStatus !== APPROVED) {
    throw new Error("Course can only be published after approval.");
  }
}

export function assertCanUnpublishCourse(course: CourseWorkflowRecord) {
  if (course.publicationStatus !== PUBLISHED) {
    throw new Error("Only published courses can be unpublished.");
  }
}

export function buildCourseWorkflowAuditLog(input: CourseWorkflowAuditInput) {
  return {
    eventType: input.eventType,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    targetType: "course",
    targetId: input.targetId,
    createdAt: input.createdAt,
    ...(input.reason ? { reason: input.reason } : {}),
    ...(input.before ? { before: input.before } : {}),
    ...(input.after ? { after: input.after } : {}),
  };
}
