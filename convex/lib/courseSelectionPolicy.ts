export const COURSE_SELECTION_LIMIT = 5;
export const COURSE_SELECTION_GRACE_PERIOD_DAYS = 7;
export const COURSE_SELECTION_GRACE_PERIOD_MS = COURSE_SELECTION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

export type CourseSelectionPolicyRecord = {
  selectedCourseIds: readonly string[];
  selectedAt: number | null;
  gracePeriodEndsAt: number | null;
  lockedAt: number | null;
  locked: boolean;
  _creationTime?: number;
};

type BuildAuthoritativeCourseSelectionArgs = {
  existing: CourseSelectionPolicyRecord | null;
  requestedCourseIds: readonly string[];
  now: number;
};

export function normalizeRequestedCourseSelectionIds(courseIds: readonly string[]) {
  const normalizedCourseIds = courseIds.map((courseId) => courseId.trim());

  if (normalizedCourseIds.some((courseId) => !courseId)) {
    throw new Error("Course selection cannot contain empty course IDs.");
  }

  if (new Set(normalizedCourseIds).size !== normalizedCourseIds.length) {
    throw new Error("Course selection cannot contain duplicate course IDs.");
  }

  if (normalizedCourseIds.length > COURSE_SELECTION_LIMIT) {
    throw new Error(`You can select up to ${COURSE_SELECTION_LIMIT} courses.`);
  }

  return normalizedCourseIds;
}

export function courseSelectionIdsMatch(left: readonly string[], right: readonly string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const rightIds = new Set(right);
  return left.every((courseId) => rightIds.has(courseId));
}

export function deriveAuthoritativeCourseSelectionState(
  selection: CourseSelectionPolicyRecord,
  now: number,
): CourseSelectionPolicyRecord {
  const selectedAt = selection._creationTime ?? selection.selectedAt ?? now;
  const gracePeriodEndsAt = selectedAt + COURSE_SELECTION_GRACE_PERIOD_MS;
  const locked = now >= gracePeriodEndsAt;

  return {
    ...selection,
    selectedAt,
    gracePeriodEndsAt,
    lockedAt: locked ? gracePeriodEndsAt : null,
    locked,
  };
}

export function buildAuthoritativeCourseSelectionWrite({
  existing,
  requestedCourseIds,
  now,
}: BuildAuthoritativeCourseSelectionArgs) {
  const selectedCourseIds = normalizeRequestedCourseSelectionIds(requestedCourseIds);

  if (!existing) {
    if (selectedCourseIds.length === 0) {
      return null;
    }

    return {
      selectedCourseIds,
      selectedAt: now,
      gracePeriodEndsAt: now + COURSE_SELECTION_GRACE_PERIOD_MS,
      lockedAt: null,
      locked: false,
    };
  }

  const currentSelection = deriveAuthoritativeCourseSelectionState(existing, now);

  if (currentSelection.locked && !courseSelectionIdsMatch(currentSelection.selectedCourseIds, selectedCourseIds)) {
    throw new Error("Course selection is locked and can no longer be changed.");
  }

  return {
    selectedCourseIds: currentSelection.locked ? [...currentSelection.selectedCourseIds] : selectedCourseIds,
    selectedAt: currentSelection.selectedAt,
    gracePeriodEndsAt: currentSelection.gracePeriodEndsAt,
    lockedAt: currentSelection.lockedAt,
    locked: currentSelection.locked,
  };
}
