import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

export const updateStudyStats = mutationGeneric({
  args: {
    userKey: v.string(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    weeklyActiveDays: v.array(v.string()),
    lastStudiedDate: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("studyStats", { ...args, updatedAt: Date.now() });
  },
});

export const updateStudyStreak = mutationGeneric({
  args: {
    userKey: v.string(),
    currentStreak: v.number(),
    lastStudiedDate: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("studyStats")
      .withIndex("by_user", (q) => q.eq("userKey", args.userKey))
      .first();

    if (!existing) {
      return await ctx.db.insert("studyStats", {
        userKey: args.userKey,
        currentStreak: args.currentStreak,
        longestStreak: args.currentStreak,
        weeklyActiveDays: [],
        lastStudiedDate: args.lastStudiedDate,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(existing._id, {
      currentStreak: args.currentStreak,
      longestStreak: Math.max(existing.longestStreak, args.currentStreak),
      lastStudiedDate: args.lastStudiedDate,
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});
