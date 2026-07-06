import type { EntitlementStatus } from "./entitlements";

export const billingLifecycleEventTypes = [
  "checkout_completed",
  "subscription_created",
  "subscription_renewed",
  "subscription_cancelled",
  "subscription_expired",
  "payment_failed",
  "payment_refunded",
] as const;

export type BillingLifecycleEventType = (typeof billingLifecycleEventTypes)[number];
export type BillingEntitlementStatus = Exclude<EntitlementStatus, "none">;

export type VerifiedBillingEntitlementEvent = {
  verified: true;
  billingEventType: BillingLifecycleEventType;
  userKey: string;
  productKey: string;
  provider: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  providerEventId?: string | null;
  currentPeriodEndsAt?: number | null;
  occurredAt?: number | null;
};

export type EntitlementWrite = {
  userKey: string;
  productKey: string;
  status: BillingEntitlementStatus;
  provider: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  providerEventId?: string;
  lastBillingEventType: BillingLifecycleEventType;
  currentPeriodEndsAt?: number;
  updatedAt: number;
};

export function getEntitlementStatusForBillingEvent(
  eventType: string | null | undefined,
): BillingEntitlementStatus | null {
  switch (eventType) {
    case "checkout_completed":
    case "subscription_created":
    case "subscription_renewed":
      return "active";
    case "subscription_cancelled":
      return "cancelled";
    case "subscription_expired":
      return "expired";
    case "payment_failed":
      return "payment_failed";
    case "payment_refunded":
      return "refunded";
    default:
      return null;
  }
}

function requireNonEmpty(value: string | null | undefined, fieldName: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`${fieldName} is required for a verified billing entitlement event.`);
  }

  return trimmed;
}

export function prepareVerifiedEntitlementWrite(
  event: Partial<VerifiedBillingEntitlementEvent> | null | undefined,
  now = Date.now(),
): EntitlementWrite {
  if (!event || event.verified !== true) {
    throw new Error("Verified billing event data is required before updating entitlements.");
  }

  const status = getEntitlementStatusForBillingEvent(event.billingEventType);

  if (!status || !event.billingEventType) {
    throw new Error("Unknown billing lifecycle event type cannot update entitlements.");
  }

  const write: EntitlementWrite = {
    userKey: requireNonEmpty(event.userKey, "userKey"),
    productKey: requireNonEmpty(event.productKey, "productKey"),
    status,
    provider: requireNonEmpty(event.provider, "provider"),
    providerCustomerId: requireNonEmpty(event.providerCustomerId, "providerCustomerId"),
    providerSubscriptionId: requireNonEmpty(event.providerSubscriptionId, "providerSubscriptionId"),
    lastBillingEventType: event.billingEventType,
    updatedAt: event.occurredAt ?? now,
  };

  const providerEventId = event.providerEventId?.trim();
  if (providerEventId) {
    write.providerEventId = providerEventId;
  }

  if (typeof event.currentPeriodEndsAt === "number") {
    write.currentPeriodEndsAt = event.currentPeriodEndsAt;
  }

  return write;
}
