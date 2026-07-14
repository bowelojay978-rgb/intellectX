import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  buildAuthoritativeCourseSelectionWrite,
  deriveAuthoritativeCourseSelectionState,
} from "./lib/courseSelectionPolicy";
import {
  isLearnerVisibleCourseRecord,
  learnerCourseVisibilityOptions,
} from "./lib/courseWorkflow";
import { resolveLearnerUserKey } from "./lib/identity";

async function assertLearnerVisibleCourseIds(ctx: any, courseIds: readonly string[]) {
  for (const courseId of courseIds) {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_stable_id", (q: any) => q.eq("stableId", courseId))
      .first();

    if (!course || !isLearnerVisibleCourseRecord(course, learnerCourseVisibilityOptions)) {
      throw new Error(`Course is not available for learner selection: ${courseId}.`);
    }
  }
}

export const getCourseSelection = queryGeneric({
  args: { userKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const selections = await ctx.db
      .query("courseSelections")
      .withIndex("by_user", (q) => q.eq("userKey", userKey))
      .collect();
    const existing = selections.sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;

    if (!existing) {
      return null;
    }

    return {
      ...existing,
      ...deriveAuthoritativeCourseSelectionState(existing, Date.now()),
    };
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
    const now = Date.now();
    const nextSelection = buildAuthoritativeCourseSelectionWrite({
      existing: existing ?? null,
      requestedCourseIds: args.selectedCourseIds,
      now,
    });

    if (!nextSelection) {
      await Promise.all(duplicates.map((selection) => ctx.db.delete(selection._id)));
      return null;
    }

    if (!existing || !deriveAuthoritativeCourseSelectionState(existing, now).locked) {
      await assertLearnerVisibleCourseIds(ctx, nextSelection.selectedCourseIds);
    }

    const authoritativeSelection = {
      userKey,
      ...nextSelection,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, authoritativeSelection);
      await Promise.all(duplicates.map((selection) => ctx.db.delete(selection._id)));
      return existing._id;
    }

    return await ctx.db.insert("courseSelections", authoritativeSelection);
  },
});
