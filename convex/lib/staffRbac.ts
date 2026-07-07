import type { UserIdentity } from "convex/server";

export const LEARNER = "learner" as const;
export const INSTRUCTOR = "instructor" as const;
export const ADMIN = "admin" as const;

export const staffRoles = [LEARNER, INSTRUCTOR, ADMIN] as const;

export type StaffRole = (typeof staffRoles)[number];

export type StaffCourseRecord = {
  instructorId?: string;
};

type ClaimRecord = Record<string, unknown>;

const trustedStaffRoleClaimPaths = [
  ["staff", "role"],
  ["metadata", "role"],
  ["publicMetadata", "role"],
  ["appMetadata", "role"],
] as const;

function isRecord(value: unknown): value is ClaimRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readClaimPath(claims: ClaimRecord, path: readonly string[]) {
  let current: unknown = claims;

  for (const segment of path) {
    if (!isRecord(current)) {
      return null;
    }

    current = current[segment];
  }

  return typeof current === "string" ? current : null;
}

function normalizeStaffRole(value: string | null | undefined): StaffRole | null {
  const normalizedRole = value?.trim().toLowerCase();

  if (normalizedRole === LEARNER || normalizedRole === INSTRUCTOR || normalizedRole === ADMIN) {
    return normalizedRole;
  }

  return null;
}

export function getActorUserIdFromIdentity(identity: UserIdentity) {
  return identity.tokenIdentifier;
}

export function resolveStaffRoleFromIdentity(identity: UserIdentity | null): StaffRole | null {
  if (!identity) {
    return null;
  }

  for (const path of trustedStaffRoleClaimPaths) {
    const role = normalizeStaffRole(readClaimPath(identity, path));

    if (role) {
      return role;
    }
  }

  return null;
}

export function requireInstructorOrAdmin(identity: UserIdentity | null) {
  const role = resolveStaffRoleFromIdentity(identity);

  if (role !== INSTRUCTOR && role !== ADMIN) {
    throw new Error("Unauthorized: trusted instructor or admin role is required.");
  }

  if (!identity) {
    throw new Error("Unauthorized: authenticated staff identity is required.");
  }

  return {
    actorUserId: getActorUserIdFromIdentity(identity),
    role,
  };
}

export function requireAdmin(identity: UserIdentity | null) {
  const role = resolveStaffRoleFromIdentity(identity);

  if (role !== ADMIN) {
    throw new Error("Unauthorized: trusted admin role is required.");
  }

  if (!identity) {
    throw new Error("Unauthorized: authenticated admin identity is required.");
  }

  return {
    actorUserId: getActorUserIdFromIdentity(identity),
    role,
  };
}

export function canManageInstructorCourse(role: StaffRole | null, course: StaffCourseRecord, actorUserId?: string) {
  if (role === ADMIN) {
    return true;
  }

  return role === INSTRUCTOR && !!actorUserId && course.instructorId === actorUserId;
}

export function canReviewCourse(role: StaffRole | null) {
  return role === ADMIN;
}
