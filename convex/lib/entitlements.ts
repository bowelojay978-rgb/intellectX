export const entitlementStatuses = [
  "none",
  "active",
  "expired",
  "cancelled",
  "refunded",
  "payment_failed",
] as const;

export type EntitlementStatus = (typeof entitlementStatuses)[number];
export type ContentAccessLevel = "free" | "paid";

export type EntitlementLike = {
  status: EntitlementStatus;
  currentPeriodEndsAt?: number | null;
} | null | undefined;

export type EntitlementAccessDecision = {
  allowed: boolean;
  reason:
    | "free_content"
    | "active_entitlement"
    | "missing_entitlement"
    | "inactive_entitlement"
    | "expired_period";
};

export function entitlementStatusAllowsAccess(status: EntitlementStatus) {
  return status === "active";
}

export function isEntitlementCurrentlyActive(entitlement: EntitlementLike, now = Date.now()) {
  if (!entitlement || !entitlementStatusAllowsAccess(entitlement.status)) {
    return false;
  }

  if (typeof entitlement.currentPeriodEndsAt === "number" && entitlement.currentPeriodEndsAt <= now) {
    return false;
  }

  return true;
}

export function getEntitlementAccessDecision({
  accessLevel,
  entitlement,
  now = Date.now(),
}: {
  accessLevel: ContentAccessLevel;
  entitlement?: EntitlementLike;
  now?: number;
}): EntitlementAccessDecision {
  if (accessLevel === "free") {
    return { allowed: true, reason: "free_content" };
  }

  if (!entitlement || entitlement.status === "none") {
    return { allowed: false, reason: "missing_entitlement" };
  }

  if (!entitlementStatusAllowsAccess(entitlement.status)) {
    return { allowed: false, reason: "inactive_entitlement" };
  }

  if (!isEntitlementCurrentlyActive(entitlement, now)) {
    return { allowed: false, reason: "expired_period" };
  }

  return { allowed: true, reason: "active_entitlement" };
}
