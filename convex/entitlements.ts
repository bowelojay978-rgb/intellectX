import { queryGeneric } from "convex/server";
import { v } from "convex/values";
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
