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

type ClerkMetadataUser = {
  publicMetadata?: Record<string, unknown>;
};

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
  nextRole: "learner" | "instructor",
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
