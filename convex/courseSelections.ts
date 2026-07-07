import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { resolveLearnerUserKey } from "./lib/identity";

export const getCourseSelection = queryGeneric({
  args: { userKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const selections = await ctx.db
      .query("courseSelections")
      .withIndex("by_user", (q) => q.eq("userKey", userKey))
      .collect();

    return selections.sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;
  },
});

export const upsertCourseSelection = mutationGeneric({
  args: {
    userKey: v.optional(v.string()),
    selectedCourseIds: v.array(v.string()),
    selectedAt: v.union(v.number(), v.null()),
    gracePeriodEndsAt: v.union(v.number(), v.null()),
    lockedAt: v.union(v.number(), v.null()),
    locked: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const existingSelections = await ctx.db
      .query("courseSelections")
      .withIndex("by_user", (q) => q.eq("userKey", userKey))
      .collect();
    const [existing, ...duplicates] = existingSelections.sort((left, right) => right.updatedAt - left.updatedAt);
    const nextSelection = {
      userKey,
      selectedCourseIds: args.selectedCourseIds,
      selectedAt: args.selectedAt,
      gracePeriodEndsAt: args.gracePeriodEndsAt,
      lockedAt: args.lockedAt,
      locked: args.locked,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, nextSelection);
      await Promise.all(duplicates.map((selection) => ctx.db.delete(selection._id)));
      return existing._id;
    }

    return await ctx.db.insert("courseSelections", nextSelection);
  },
});
