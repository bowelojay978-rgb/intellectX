export type StudyStatsSnapshot = {
  currentStreak: number;
  longestStreak: number;
  weeklyActiveDays: string[];
  lastStudiedDate: string;
};

function parseRequiredStudyDate(value: string) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    throw new Error("Study stats lastStudiedDate must be a valid date.");
  }

  return timestamp;
}

function parseExistingStudyDate(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function normalizeSnapshot(snapshot: StudyStatsSnapshot): StudyStatsSnapshot {
  const currentStreak = Math.max(0, snapshot.currentStreak);

  return {
    currentStreak,
    longestStreak: Math.max(0, snapshot.longestStreak, currentStreak),
    weeklyActiveDays: [...new Set(snapshot.weeklyActiveDays)],
    lastStudiedDate: snapshot.lastStudiedDate,
  };
}

export function mergeStudyStatsSnapshot(
  existing: StudyStatsSnapshot | null,
  incoming: StudyStatsSnapshot,
): StudyStatsSnapshot {
  const normalizedIncoming = normalizeSnapshot(incoming);
  const incomingTimestamp = parseRequiredStudyDate(normalizedIncoming.lastStudiedDate);

  if (!existing) {
    return normalizedIncoming;
  }

  const normalizedExisting = normalizeSnapshot(existing);
  const existingTimestamp = parseExistingStudyDate(normalizedExisting.lastStudiedDate);
  const longestStreak = Math.max(
    normalizedExisting.longestStreak,
    normalizedIncoming.longestStreak,
    normalizedIncoming.currentStreak,
  );

  if (incomingTimestamp < existingTimestamp) {
    return {
      ...normalizedExisting,
      longestStreak,
    };
  }

  return {
    ...normalizedIncoming,
    longestStreak,
  };
}
