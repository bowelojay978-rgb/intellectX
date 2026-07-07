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
  id?: string;
  stableId?: string;
  reviewStatus?: CourseStatus;
  publicationStatus?: CourseStatus;
  instructorId?: string;
  submittedAt?: number;
  reviewedAt?: number;
  reviewedBy?: string;
  reviewReason?: string;
};

export type CourseWorkflowVisibilityOptions = {
  trustedLegacyCourseIds?: readonly string[];
};

export type StaffArea = "instructor" | "admin";

function getCourseWorkflowRecordId(state: CourseWorkflowState) {
  return state.id ?? state.stableId;
}

export function resolveCourseWorkflowState(
  state: CourseWorkflowState,
  options: CourseWorkflowVisibilityOptions = {},
): CourseWorkflowState {
  const recordId = getCourseWorkflowRecordId(state);

  if (
    recordId &&
    options.trustedLegacyCourseIds?.includes(recordId) &&
    !state.reviewStatus &&
    !state.publicationStatus
  ) {
    return {
      ...state,
      reviewStatus: APPROVED,
      publicationStatus: PUBLISHED,
    };
  }

  return state;
}

export function isLearnerVisibleCourse(
  state: CourseWorkflowState,
  options: CourseWorkflowVisibilityOptions = {},
) {
  const resolvedState = resolveCourseWorkflowState(state, options);

  return resolvedState.reviewStatus === APPROVED && resolvedState.publicationStatus === PUBLISHED;
}

export function filterLearnerVisibleCourses<T extends CourseWorkflowState>(
  courses: T[],
  options?: CourseWorkflowVisibilityOptions,
) {
  return courses.filter((course) => isLearnerVisibleCourse(course, options));
}

export function findLearnerVisibleCourse<T extends CourseWorkflowState & { id: string; slug?: string }>(
  courses: T[],
  idOrSlug: string,
  options?: CourseWorkflowVisibilityOptions,
) {
  return filterLearnerVisibleCourses(courses, options).find(
    (course) => course.id === idOrSlug || course.slug === idOrSlug,
  );
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

export function isCourseRole(value: string | null | undefined): value is CourseRole {
  return value === LEARNER || value === INSTRUCTOR || value === ADMIN;
}

export function canAccessStaffArea(role: string | null | undefined, area: StaffArea) {
  if (area === "instructor") {
    return role === INSTRUCTOR || role === ADMIN;
  }

  if (area === "admin") {
    return role === ADMIN;
  }

  return false;
}

export function canManageCourseWorkflow(role: string | null | undefined) {
  return role === ADMIN;
}

export function canReviewCourses(role: string | null | undefined) {
  return role === ADMIN;
}

export function canSubmitCourseForReview(role: string | null | undefined) {
  return role === INSTRUCTOR || role === ADMIN;
}
