import { describe, expect, it } from "vitest";

import {
  entitlementStatusAllowsAccess,
  getContentAccessLevel,
  getEntitlementAccessDecision,
  isEntitlementCurrentlyActive,
  type EntitlementStatus,
} from "@/lib/entitlements";

describe("entitlement policy", () => {
  it("allows free content without an entitlement", () => {
    expect(getEntitlementAccessDecision({ accessLevel: "free" })).toEqual({
      allowed: true,
      reason: "free_content",
    });
    expect(getContentAccessLevel({})).toBe("free");
  });

  it("allows paid access only for active entitlements", () => {
    expect(
      getEntitlementAccessDecision({
        accessLevel: "paid",
        entitlement: { status: "active" },
      }),
    ).toEqual({
      allowed: true,
      reason: "active_entitlement",
    });
  });

  it("rejects paid access when entitlement is missing", () => {
    expect(getEntitlementAccessDecision({ accessLevel: "paid" })).toEqual({
      allowed: false,
      reason: "missing_entitlement",
    });
    expect(getEntitlementAccessDecision({ accessLevel: "paid", entitlement: { status: "none" } })).toEqual({
      allowed: false,
      reason: "missing_entitlement",
    });
  });

  it("rejects inactive entitlement statuses", () => {
    const inactiveStatuses = ["expired", "cancelled", "refunded", "payment_failed"] as const satisfies EntitlementStatus[];

    for (const status of inactiveStatuses) {
      expect(entitlementStatusAllowsAccess(status)).toBe(false);
      expect(getEntitlementAccessDecision({ accessLevel: "paid", entitlement: { status } })).toEqual({
        allowed: false,
        reason: "inactive_entitlement",
      });
    }
  });

  it("rejects active entitlements after their access period ends", () => {
    expect(isEntitlementCurrentlyActive({ status: "active", currentPeriodEndsAt: 1000 }, 1000)).toBe(false);
    expect(
      getEntitlementAccessDecision({
        accessLevel: "paid",
        entitlement: { status: "active", currentPeriodEndsAt: 1000 },
        now: 1000,
      }),
    ).toEqual({
      allowed: false,
      reason: "expired_period",
    });
  });
});
