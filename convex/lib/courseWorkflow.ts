export const APPROVED = "approved" as const;
export const PUBLISHED = "published" as const;

export const courseStatuses = [
  "draft",
  "submitted_for_review",
  "changes_requested",
  "approved",
  "published",
  "unpublished",
  "archived",
] as const;

export type CourseStatus = (typeof courseStatuses)[number];

export type CourseWorkflowState = {
  id?: string;
  stableId?: string;
  reviewStatus?: CourseStatus;
  publicationStatus?: CourseStatus;
};

export type CourseWorkflowVisibilityOptions = {
  trustedLegacyCourseIds?: readonly string[];
};

function getCourseWorkflowRecordId(course: CourseWorkflowState) {
  return course.stableId ?? course.id;
}

export function resolveCourseWorkflowState<T extends CourseWorkflowState>(
  course: T,
  options: CourseWorkflowVisibilityOptions = {},
): T {
  const recordId = getCourseWorkflowRecordId(course);

  if (
    recordId &&
    options.trustedLegacyCourseIds?.includes(recordId) &&
    !course.reviewStatus &&
    !course.publicationStatus
  ) {
    return {
      ...course,
      reviewStatus: APPROVED,
      publicationStatus: PUBLISHED,
    };
  }

  return course;
}

export function isLearnerVisibleCourseRecord(
  course: CourseWorkflowState,
  options: CourseWorkflowVisibilityOptions = {},
) {
  const resolvedCourse = resolveCourseWorkflowState(course, options);

  return resolvedCourse.reviewStatus === APPROVED && resolvedCourse.publicationStatus === PUBLISHED;
}

export function filterLearnerVisibleCourseRecords<T extends CourseWorkflowState>(
  courses: T[],
  options?: CourseWorkflowVisibilityOptions,
) {
  return courses.filter((course) => isLearnerVisibleCourseRecord(course, options));
}
