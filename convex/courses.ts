import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import { filterLearnerVisibleCourseRecords, isLearnerVisibleCourseRecord } from "./lib/courseWorkflow";

const learnerVisibilityOptions = {
  trustedLegacyCourseIds: ["ai-study-systems", "critical-thinking", "exam-accelerator"],
};

export const listCourses = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();

    return filterLearnerVisibleCourseRecords(courses, learnerVisibilityOptions);
  },
});

export const getCourseBySlug = queryGeneric({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!course || !isLearnerVisibleCourseRecord(course, learnerVisibilityOptions)) {
      return null;
    }

    return course;
  },
});

export const getCourseByStableId = queryGeneric({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_stable_id", (q) => q.eq("stableId", args.stableId))
      .first();

    if (!course || !isLearnerVisibleCourseRecord(course, learnerVisibilityOptions)) {
      return null;
    }

    return course;
  },
});
