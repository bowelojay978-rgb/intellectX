import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

export const upsertLessonNote = mutationGeneric({
  args: {
    userKey: v.string(),
    lessonStableId: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notes")
      .withIndex("by_user_lesson", (q) => q.eq("userKey", args.userKey))
      .collect()
      .then((notes) => notes.find((note) => note.lessonId === args.lessonStableId));

    if (existing) {
      await ctx.db.patch(existing._id, { body: args.body, updatedAt: Date.now() });
      return existing._id;
    }

    return await ctx.db.insert("notes", {
      userKey: args.userKey,
      lessonId: args.lessonStableId,
      body: args.body,
      updatedAt: Date.now(),
    });
  },
});
