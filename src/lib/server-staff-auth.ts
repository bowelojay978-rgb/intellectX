import { resolveTrustedStaffRoleFromClaims } from "@/lib/staff-route-runtime-access";
import { auth, clerkClient } from "@clerk/nextjs/server";

export type AdminManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "learner" | "instructor" | "admin";
  createdAt: number;
  lastSignInAt: number | null;
};

type StaffAssignableRole = "learner" | "instructor";

type ClerkMetadataUser = {
  publicMetadata?: Record<string, unknown>;
};

type ClerkPrivateMetadataUser = {
  privateMetadata?: Record<string, unknown>;
};

export type StaffRoleAuditEntry = {
  eventType: "staff_role_changed";
  actorUserId: string;
  targetUserId: string;
  previousRole: StaffAssignableRole;
  nextRole: StaffAssignableRole;
  changedAt: number;
};

const STAFF_ROLE_AUDIT_LIMIT = 25;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRole(value: unknown): AdminManagedUser["role"] {
  if (typeof value !== "string") return "learner";
  const role = value.trim().toLowerCase();
  return role === "instructor" || role === "admin" ? role : "learner";
}

export function readUserRole(user: ClerkMetadataUser) {
  const publicMetadata = user.publicMetadata ?? {};
  const nestedStaff = publicMetadata.staff;

  if (nestedStaff && typeof nestedStaff === "object" && !Array.isArray(nestedStaff)) {
    const nestedRole = (nestedStaff as Record<string, unknown>).role;
    if (typeof nestedRole === "string") return normalizeRole(nestedRole);
  }

  return normalizeRole(publicMetadata.role);
}

export function buildPublicMetadataWithStaffRole(
  publicMetadata: Record<string, unknown> | undefined,
  nextRole: StaffAssignableRole,
) {
  const currentMetadata = publicMetadata ?? {};
  const currentStaff = currentMetadata.staff;
  const staffMetadata = currentStaff && typeof currentStaff === "object" && !Array.isArray(currentStaff)
    ? { ...(currentStaff as Record<string, unknown>) }
    : {};

  return {
    ...currentMetadata,
    role: nextRole,
    staff: {
      ...staffMetadata,
      role: nextRole,
    },
  };
}

function normalizeStaffAssignableRole(role: AdminManagedUser["role"]): StaffAssignableRole {
  return role === "instructor" ? "instructor" : "learner";
}

function readExistingRoleAudit(privateMetadata: Record<string, unknown> | undefined): StaffRoleAuditEntry[] {
  const audit = privateMetadata?.staffRoleAudit;

  if (!Array.isArray(audit)) {
    return [];
  }

  return audit.filter((entry): entry is StaffRoleAuditEntry => {
    if (!isRecord(entry)) return false;

    return (
      entry.eventType === "staff_role_changed" &&
      typeof entry.actorUserId === "string" &&
      typeof entry.targetUserId === "string" &&
      (entry.previousRole === "learner" || entry.previousRole === "instructor") &&
      (entry.nextRole === "learner" || entry.nextRole === "instructor") &&
      typeof entry.changedAt === "number" &&
      Number.isFinite(entry.changedAt)
    );
  });
}

export function buildStaffRoleAuditEntry(args: {
  actorUserId: string;
  targetUserId: string;
  previousRole: AdminManagedUser["role"];
  nextRole: StaffAssignableRole;
  changedAt: number;
}): StaffRoleAuditEntry {
  return {
    eventType: "staff_role_changed",
    actorUserId: args.actorUserId,
    targetUserId: args.targetUserId,
    previousRole: normalizeStaffAssignableRole(args.previousRole),
    nextRole: args.nextRole,
    changedAt: args.changedAt,
  };
}

export function buildPrivateMetadataWithStaffRoleAudit(
  privateMetadata: ClerkPrivateMetadataUser["privateMetadata"],
  entry: StaffRoleAuditEntry,
) {
  const currentMetadata = privateMetadata ?? {};
  const existingAudit = readExistingRoleAudit(currentMetadata);

  return {
    ...currentMetadata,
    staffRoleAudit: [entry, ...existingAudit]
      .sort((left, right) => right.changedAt - left.changedAt)
      .slice(0, STAFF_ROLE_AUDIT_LIMIT),
  };
}

export async function getAdminClerkSession() {
  try {
    const authState = await auth();
    const role = authState.isAuthenticated
      ? resolveTrustedStaffRoleFromClaims(authState.sessionClaims)
      : null;

    if (!authState.isAuthenticated || !authState.userId || role !== "admin") {
      return null;
    }

    return { userId: authState.userId, role } as const;
  } catch {
    return null;
  }
}

export async function listAdminManagedUsers(): Promise<AdminManagedUser[]> {
  const session = await getAdminClerkSession();
  if (!session) return [];

  const client = await clerkClient();
  const users = [];
  const pageSize = 100;
  let offset = 0;

  for (;;) {
    const response = await client.users.getUserList({
      limit: pageSize,
      offset,
      orderBy: "-created_at",
    });

    users.push(...response.data);

    if (response.data.length < pageSize) {
      break;
    }

    offset += response.data.length;
  }

  return users.map((user) => ({
    id: user.id,
    name:
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      user.primaryEmailAddress?.emailAddress ||
      "Unnamed user",
    email: user.primaryEmailAddress?.emailAddress ?? "No primary email",
    role: readUserRole(user),
    createdAt: user.createdAt,
    lastSignInAt: user.lastSignInAt ?? null,
  }));
}
