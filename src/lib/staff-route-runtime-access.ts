import {
  canAccessStaffRoute,
  getStaffRouteRequirement,
  normalizeStaffRole,
  type StaffRole,
} from "@/lib/staff-route-access-policy";

type ClaimRecord = Record<string, unknown>;

export type StaffRouteAccessDecision = {
  allowed: boolean;
  role: StaffRole | null;
  reason: "allowed" | "missing_role" | "denied" | "not_staff_route";
};

const trustedStaffRoleClaimPaths = [
  ["metadata", "role"],
  ["publicMetadata", "role"],
  ["appMetadata", "role"],
  ["staff", "role"],
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

export function resolveTrustedStaffRoleFromClaims(claims: unknown) {
  if (!isRecord(claims)) {
    return null;
  }

  for (const path of trustedStaffRoleClaimPaths) {
    const role = normalizeStaffRole(readClaimPath(claims, path));

    if (role) {
      return role;
    }
  }

  return null;
}

export function resolveStaffRouteAccess(role: string | null | undefined, pathname: string): StaffRouteAccessDecision {
  const requirement = getStaffRouteRequirement(pathname);

  if (!requirement) {
    return {
      allowed: false,
      role: null,
      reason: "not_staff_route",
    };
  }

  const normalizedRole = normalizeStaffRole(role);

  if (!normalizedRole) {
    return {
      allowed: false,
      role: null,
      reason: "missing_role",
    };
  }

  if (!canAccessStaffRoute(normalizedRole, pathname)) {
    return {
      allowed: false,
      role: normalizedRole,
      reason: "denied",
    };
  }

  return {
    allowed: true,
    role: normalizedRole,
    reason: "allowed",
  };
}
