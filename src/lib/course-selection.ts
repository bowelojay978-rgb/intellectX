"use client";

export const COURSE_SELECTION_KEY = "intellectx:course-selection";
export const COURSE_SELECTION_CHANGE_EVENT = "intellectx:course-selection-change";
export const COURSE_SELECTION_SYNC_STATUS_EVENT = "intellectx-course-selection-sync-status";
export const COURSE_SELECTION_SYNC_RETRY_EVENT = "intellectx-course-selection-sync-retry";
export const COURSE_SELECTION_LIMIT = 5;
export const COURSE_SELECTION_GRACE_PERIOD_DAYS = 7;

const gracePeriodMs = COURSE_SELECTION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

export type CourseSelection = {
  selectedCourseIds: string[];
  selectedAt: number | null;
  gracePeriodEndsAt: number | null;
  lockedAt: number | null;
  locked: boolean;
};

export type CourseSelectionUpdate = {
  selection: CourseSelection;
  error?: string;
};

export type CourseSelectionSyncStatus = "idle" | "pending" | "success" | "error";

export type CourseSelectionSyncStatusDetail = {
  status: CourseSelectionSyncStatus;
};

export function dispatchCourseSelectionSyncStatus(status: CourseSelectionSyncStatus) {
  window.dispatchEvent(
    new CustomEvent<CourseSelectionSyncStatusDetail>(COURSE_SELECTION_SYNC_STATUS_EVENT, {
      detail: { status },
    }),
  );
}

export function retryCourseSelectionSync() {
  window.dispatchEvent(new Event(COURSE_SELECTION_SYNC_RETRY_EVENT));
}

export function getSelectedCourseIdsOutsideVisibleCourses(selectedCourseIds: string[], visibleCourseIds: string[]) {
  const visibleCourseIdsSet = new Set(visibleCourseIds);
  return selectedCourseIds.filter((courseId) => !visibleCourseIdsSet.has(courseId));
}

export function getEmptyCourseSelection(): CourseSelection {
  return {
    selectedCourseIds: [],
    selectedAt: null,
    gracePeriodEndsAt: null,
    lockedAt: null,
    locked: false,
  };
}

function isCourseSelection(value: unknown): value is CourseSelection {
  if (!value || typeof value !== "object") return false;

  const selection = value as Partial<CourseSelection>;

  return (
    Array.isArray(selection.selectedCourseIds) &&
    (typeof selection.selectedAt === "number" || selection.selectedAt === null) &&
    (typeof selection.gracePeriodEndsAt === "number" || selection.gracePeriodEndsAt === null) &&
    (typeof selection.lockedAt === "number" || selection.lockedAt === null) &&
    typeof selection.locked === "boolean"
  );
}

export function normalizeCourseSelection(selection: CourseSelection, now = Date.now()): CourseSelection {
  const selectedCourseIds = Array.from(new Set(selection.selectedCourseIds)).filter(Boolean);
  const selectedAt = selectedCourseIds.length > 0 ? selection.selectedAt ?? now : null;
  const gracePeriodEndsAt = selectedAt ? selection.gracePeriodEndsAt ?? selectedAt + gracePeriodMs : null;
  const locked = Boolean(selectedCourseIds.length > 0 && gracePeriodEndsAt && now >= gracePeriodEndsAt);

  return {
    selectedCourseIds,
    selectedAt,
    gracePeriodEndsAt,
    lockedAt: locked ? selection.lockedAt ?? gracePeriodEndsAt : null,
    locked,
  };
}

export function loadCourseSelection(): CourseSelection {
  const storedSelection = window.localStorage.getItem(COURSE_SELECTION_KEY);

  if (!storedSelection) {
    return getEmptyCourseSelection();
  }

  try {
    const parsedSelection = JSON.parse(storedSelection);
    return isCourseSelection(parsedSelection)
      ? normalizeCourseSelection(parsedSelection)
      : getEmptyCourseSelection();
  } catch {
    window.localStorage.removeItem(COURSE_SELECTION_KEY);
    return getEmptyCourseSelection();
  }
}

export function saveCourseSelection(selection: CourseSelection) {
  const normalizedSelection = normalizeCourseSelection(selection);
  window.localStorage.setItem(COURSE_SELECTION_KEY, JSON.stringify(normalizedSelection));
  window.dispatchEvent(new Event(COURSE_SELECTION_CHANGE_EVENT));
  return normalizedSelection;
}

export function clearCourseSelection() {
  window.localStorage.removeItem(COURSE_SELECTION_KEY);
  window.dispatchEvent(new Event(COURSE_SELECTION_CHANGE_EVENT));
}

export function hasSelectedCourses(selection = loadCourseSelection()) {
  return selection.selectedCourseIds.length > 0;
}

export function toggleSelectedCourse(courseId: string, selection = loadCourseSelection()): CourseSelectionUpdate {
  const normalizedSelection = normalizeCourseSelection(selection);

  if (normalizedSelection.locked) {
    return {
      selection: normalizedSelection,
      error: "Course selection is locked. Course resets will require admin or support later.",
    };
  }

  const selected = normalizedSelection.selectedCourseIds.includes(courseId);

  if (selected) {
    return {
      selection: saveCourseSelection({
        ...normalizedSelection,
        selectedCourseIds: normalizedSelection.selectedCourseIds.filter((selectedCourseId) => selectedCourseId !== courseId),
      }),
    };
  }

  if (normalizedSelection.selectedCourseIds.length >= COURSE_SELECTION_LIMIT) {
    return {
      selection: normalizedSelection,
      error: `You can select up to ${COURSE_SELECTION_LIMIT} courses.`,
    };
  }

  const selectedAt = normalizedSelection.selectedAt ?? Date.now();

  return {
    selection: saveCourseSelection({
      ...normalizedSelection,
      selectedCourseIds: [...normalizedSelection.selectedCourseIds, courseId],
      selectedAt,
      gracePeriodEndsAt: normalizedSelection.gracePeriodEndsAt ?? selectedAt + gracePeriodMs,
    }),
  };
}
