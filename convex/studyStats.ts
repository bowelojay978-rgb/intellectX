import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import { resolveLearnerUserKey } from "./lib/identity";
import { mergeStudyStatsSnapshot } from "./lib/studyStats";

async function getCurrentStudyStatsRecords(ctx: any, userKey: string) {
  const records = await ctx.db
    .query("studyStats")
    .withIndex("by_user", (q: any) => q.eq("userKey", userKey))
    .collect();

  return records.sort((left: any, right: any) => right.updatedAt - left.updatedAt);
}

export const updateStudyStats = mutationGeneric({
  args: {
    userKey: v.optional(v.string()),
    currentStreak: v.number(),
    longestStreak: v.number(),
    weeklyActiveDays: v.array(v.string()),
    lastStudiedDate: v.string(),
  },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const [existing, ...duplicates] = await getCurrentStudyStatsRecords(ctx, userKey);
    const mergedStats = mergeStudyStatsSnapshot(
      existing
        ? {
            currentStreak: existing.currentStreak,
            longestStreak: existing.longestStreak,
            weeklyActiveDays: existing.weeklyActiveDays,
            lastStudiedDate: existing.lastStudiedDate,
          }
        : null,
      {
        currentStreak: args.currentStreak,
        longestStreak: args.longestStreak,
        weeklyActiveDays: args.weeklyActiveDays,
        lastStudiedDate: args.lastStudiedDate,
      },
    );
    const nextStats = {
      userKey,
      ...mergedStats,
      updatedAt: Date.now(),
    };

    if (!existing) {
      return await ctx.db.insert("studyStats", nextStats);
    }

    await ctx.db.patch(existing._id, nextStats);
    await Promise.all(duplicates.map((record: any) => ctx.db.delete(record._id)));

    return existing._id;
  },
});

export const updateStudyStreak = mutationGeneric({
  args: {
    userKey: v.optional(v.string()),
    currentStreak: v.number(),
    lastStudiedDate: v.string(),
  },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const [existing, ...duplicates] = await getCurrentStudyStatsRecords(ctx, userKey);
    const mergedStats = mergeStudyStatsSnapshot(
      existing
        ? {
            currentStreak: existing.currentStreak,
            longestStreak: existing.longestStreak,
            weeklyActiveDays: existing.weeklyActiveDays,
            lastStudiedDate: existing.lastStudiedDate,
          }
        : null,
      {
        currentStreak: args.currentStreak,
        longestStreak: args.currentStreak,
        weeklyActiveDays: existing?.weeklyActiveDays ?? [],
        lastStudiedDate: args.lastStudiedDate,
      },
    );
    const nextStats = {
      userKey,
      ...mergedStats,
      updatedAt: Date.now(),
    };

    if (!existing) {
      return await ctx.db.insert("studyStats", nextStats);
    }

    await ctx.db.patch(existing._id, nextStats);
    await Promise.all(duplicates.map((record: any) => ctx.db.delete(record._id)));

    return existing._id;
  },
});
