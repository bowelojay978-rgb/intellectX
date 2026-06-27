import { queryGeneric } from "convex/server";
import { v } from "convex/values";

export const listCourses = queryGeneric({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});

export const getCourseBySlug = queryGeneric({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getCourseByStableId = queryGeneric({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_stable_id", (q) => q.eq("stableId", args.stableId))
      .first();
  },
});
