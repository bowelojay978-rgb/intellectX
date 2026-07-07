export const LEARNER = "learner" as const;
export const INSTRUCTOR = "instructor" as const;
export const ADMIN = "admin" as const;

export type CourseRole = typeof LEARNER | typeof INSTRUCTOR | typeof ADMIN;

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

export type CourseWorkflowState = {
  reviewStatus: CourseStatus;
  publicationStatus: CourseStatus;
};

export function isLearnerVisibleCourse(state: CourseWorkflowState) {
  return state.reviewStatus === APPROVED && state.publicationStatus === PUBLISHED;
}

export function canTransitionCourseStatus(from: CourseStatus, to: CourseStatus, actorRole: CourseRole) {
  if (from === to) {
    return false;
  }

  if (actorRole === LEARNER) {
    return false;
  }

  if (actorRole === INSTRUCTOR) {
    return (from === DRAFT || from === CHANGES_REQUESTED) && to === SUBMITTED_FOR_REVIEW;
  }

  if (actorRole === ADMIN) {
    if ((from === SUBMITTED_FOR_REVIEW && (to === APPROVED || to === CHANGES_REQUESTED)) || (from === APPROVED && to === PUBLISHED) || (from === PUBLISHED && to === UNPUBLISHED) || (from === UNPUBLISHED && to === PUBLISHED)) {
      return true;
    }

    return from !== ARCHIVED && to === ARCHIVED;
  }

  return false;
}
