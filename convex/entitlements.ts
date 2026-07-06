import { internalMutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  getEntitlementStatusForBillingEvent,
  prepareVerifiedEntitlementWrite,
} from "./lib/billingLifecycle";
import { getEntitlementAccessDecision } from "./lib/entitlements";
import { resolveLearnerUserKey } from "./lib/identity";

export const getPaidAccessDecision = queryGeneric({
  args: {
    userKey: v.string(),
    productKey: v.string(),
  },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const entitlements = await ctx.db
      .query("entitlements")
      .withIndex("by_user_product", (q) => q.eq("userKey", userKey))
      .filter((q) => q.eq(q.field("productKey"), args.productKey))
      .collect();
    const entitlement = entitlements.sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;

    return getEntitlementAccessDecision({
      accessLevel: "paid",
      entitlement: entitlement
        ? {
            status: entitlement.status,
            currentPeriodEndsAt: entitlement.currentPeriodEndsAt,
          }
        : null,
    });
  },
});

export const applyVerifiedBillingEntitlementEvent = internalMutationGeneric({
  args: {
    verified: v.literal(true),
    billingEventType: v.union(
      v.literal("checkout_completed"),
      v.literal("subscription_created"),
      v.literal("subscription_renewed"),
      v.literal("subscription_cancelled"),
      v.literal("subscription_expired"),
      v.literal("payment_failed"),
      v.literal("payment_refunded"),
    ),
    userKey: v.string(),
    productKey: v.string(),
    provider: v.string(),
    providerCustomerId: v.string(),
    providerSubscriptionId: v.string(),
    providerEventId: v.optional(v.string()),
    currentPeriodEndsAt: v.optional(v.number()),
    occurredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const entitlementWrite = prepareVerifiedEntitlementWrite(args);

    if (!getEntitlementStatusForBillingEvent(args.billingEventType)) {
      throw new Error("Unknown billing lifecycle event type cannot update entitlements.");
    }

    const existingEntitlement = await ctx.db
      .query("entitlements")
      .withIndex("by_user_product_provider_subscription", (q) =>
        q.eq("userKey", entitlementWrite.userKey),
      )
      .filter((q) => q.eq(q.field("productKey"), entitlementWrite.productKey))
      .filter((q) => q.eq(q.field("provider"), entitlementWrite.provider))
      .filter((q) => q.eq(q.field("providerSubscriptionId"), entitlementWrite.providerSubscriptionId))
      .first();

    const patch = {
      productKey: entitlementWrite.productKey,
      status: entitlementWrite.status,
      provider: entitlementWrite.provider,
      providerCustomerId: entitlementWrite.providerCustomerId,
      providerSubscriptionId: entitlementWrite.providerSubscriptionId,
      providerEventId: entitlementWrite.providerEventId,
      lastBillingEventType: entitlementWrite.lastBillingEventType,
      currentPeriodEndsAt: entitlementWrite.currentPeriodEndsAt,
      updatedAt: entitlementWrite.updatedAt,
    };

    if (existingEntitlement) {
      await ctx.db.patch(existingEntitlement._id, patch);

      return {
        action: "updated",
        entitlementId: existingEntitlement._id,
        status: entitlementWrite.status,
      };
    }

    const entitlementId = await ctx.db.insert("entitlements", {
      userKey: entitlementWrite.userKey,
      ...patch,
    });

    return {
      action: "inserted",
      entitlementId,
      status: entitlementWrite.status,
    };
  },
});
