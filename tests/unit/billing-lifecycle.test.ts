import { describe, expect, it } from "vitest";

import {
  getEntitlementStatusForBillingEvent,
  prepareVerifiedEntitlementWrite,
  type BillingLifecycleEventType,
  type VerifiedBillingEntitlementEvent,
} from "../../convex/lib/billingLifecycle";

const activeEvents = [
  "checkout_completed",
  "subscription_created",
  "subscription_renewed",
] as const satisfies BillingLifecycleEventType[];

const inactiveEventExpectations = [
  ["subscription_cancelled", "cancelled"],
  ["subscription_expired", "expired"],
  ["payment_failed", "payment_failed"],
  ["payment_refunded", "refunded"],
] as const satisfies ReadonlyArray<readonly [BillingLifecycleEventType, string]>;

function verifiedEvent(overrides: Partial<VerifiedBillingEntitlementEvent> = {}): VerifiedBillingEntitlementEvent {
  return {
    verified: true,
    billingEventType: "subscription_created",
    userKey: "auth:https://clerk.example|user_123",
    productKey: "intellectx.scholar",
    provider: "paddle",
    providerCustomerId: "ctm_123",
    providerSubscriptionId: "sub_123",
    providerEventId: "evt_123",
    currentPeriodEndsAt: 2000,
    occurredAt: 1000,
    ...overrides,
  };
}

describe("billing lifecycle entitlement mapping", () => {
  it("maps checkout and subscription start or renewal events to active entitlement", () => {
    for (const eventType of activeEvents) {
      expect(getEntitlementStatusForBillingEvent(eventType)).toBe("active");
      expect(prepareVerifiedEntitlementWrite(verifiedEvent({ billingEventType: eventType })).status).toBe("active");
    }
  });

  it("maps cancellation, expiry, failure, and refund events to inactive entitlement states", () => {
    for (const [eventType, status] of inactiveEventExpectations) {
      expect(getEntitlementStatusForBillingEvent(eventType)).toBe(status);
      expect(prepareVerifiedEntitlementWrite(verifiedEvent({ billingEventType: eventType })).status).toBe(status);
    }
  });

  it("fails closed for missing or unknown lifecycle events", () => {
    expect(getEntitlementStatusForBillingEvent(null)).toBeNull();
    expect(getEntitlementStatusForBillingEvent("invoice_updated")).toBeNull();
    expect(() =>
      prepareVerifiedEntitlementWrite(
        verifiedEvent({ billingEventType: "invoice_updated" as BillingLifecycleEventType }),
      ),
    ).toThrow("Unknown billing lifecycle event type cannot update entitlements.");
  });

  it("requires verified server or provider data before preparing an entitlement write", () => {
    expect(() => prepareVerifiedEntitlementWrite({ ...verifiedEvent(), verified: false as unknown as true })).toThrow(
      "Verified billing event data is required before updating entitlements.",
    );
  });

  it("normalizes provider metadata for idempotent entitlement upserts", () => {
    expect(
      prepareVerifiedEntitlementWrite(
        verifiedEvent({
          userKey: " auth:https://clerk.example|user_123 ",
          productKey: " intellectx.scholar ",
          provider: " paddle ",
          providerCustomerId: " ctm_123 ",
          providerSubscriptionId: " sub_123 ",
          providerEventId: " evt_123 ",
        }),
      ),
    ).toEqual({
      userKey: "auth:https://clerk.example|user_123",
      productKey: "intellectx.scholar",
      status: "active",
      provider: "paddle",
      providerCustomerId: "ctm_123",
      providerSubscriptionId: "sub_123",
      providerEventId: "evt_123",
      lastBillingEventType: "subscription_created",
      currentPeriodEndsAt: 2000,
      updatedAt: 1000,
    });
  });

  it("rejects frontend-style entitlement claims without provider subscription metadata", () => {
    expect(() =>
      prepareVerifiedEntitlementWrite({
        verified: true,
        billingEventType: "checkout_completed",
        userKey: "auth:https://clerk.example|user_123",
        productKey: "intellectx.scholar",
      }),
    ).toThrow("provider is required for a verified billing entitlement event.");
  });
});
