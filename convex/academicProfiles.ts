import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const getAcademicProfile = queryGeneric({
  args: { userKey: v.string() },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("academicProfiles")
      .withIndex("by_user", (q) => q.eq("userKey", args.userKey))
      .collect();

    return profiles.sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;
  },
});

export const upsertAcademicProfile = mutationGeneric({
  args: {
    userKey: v.string(),
    educationLevel: v.string(),
    curriculumOrInstitution: v.string(),
    gradeOrYear: v.string(),
    subjectsOrModules: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existingProfiles = await ctx.db
      .query("academicProfiles")
      .withIndex("by_user", (q) => q.eq("userKey", args.userKey))
      .collect();

    const [existing, ...duplicates] = existingProfiles.sort((left, right) => right.updatedAt - left.updatedAt);
    const nextProfile = {
      userKey: args.userKey,
      educationLevel: args.educationLevel,
      curriculumOrInstitution: args.curriculumOrInstitution,
      gradeOrYear: args.gradeOrYear,
      subjectsOrModules: args.subjectsOrModules,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, nextProfile);
      await Promise.all(duplicates.map((profile) => ctx.db.delete(profile._id)));
      return existing._id;
    }

    return await ctx.db.insert("academicProfiles", nextProfile);
  },
});

export const clearAcademicProfile = mutationGeneric({
  args: { userKey: v.string() },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("academicProfiles")
      .withIndex("by_user", (q) => q.eq("userKey", args.userKey))
      .collect();

    await Promise.all(profiles.map((profile) => ctx.db.delete(profile._id)));

    return profiles.length;
  },
});
