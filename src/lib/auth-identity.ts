import type { LearnerSession } from "@/lib/learner-session";

type ClerkDisplayUser = {
  fullName?: string | null;
  firstName?: string | null;
  username?: string | null;
  primaryEmailAddress?: {
    emailAddress?: string | null;
  } | null;
};

export function getClerkDisplayName(user: ClerkDisplayUser | null | undefined, fallback = "Learner") {
  return (
    user?.fullName?.trim() ||
    user?.firstName?.trim() ||
    user?.username?.trim() ||
    user?.primaryEmailAddress?.emailAddress?.trim() ||
    fallback
  );
}

export function getLocalLearnerDisplayName(session: LearnerSession | null | undefined, fallback = "Learner") {
  return session?.name?.trim() || fallback;
}

export function getFirstDisplayNamePart(displayName: string, fallback = "Learner") {
  return displayName.split(/\s+/)[0] || fallback;
}
