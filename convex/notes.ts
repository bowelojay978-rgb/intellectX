import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { resolveLearnerUserKey } from "./lib/identity";

export const getLessonNote = queryGeneric({
  args: {
    userKey: v.optional(v.string()),
    lessonStableId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user_lesson", (q) => q.eq("userKey", userKey))
      .filter((q) => q.eq(q.field("lessonId"), args.lessonStableId))
      .collect();

    return notes.sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;
  },
});

export const upsertLessonNote = mutationGeneric({
  args: {
    userKey: v.optional(v.string()),
    lessonStableId: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const { userKey } = await resolveLearnerUserKey(ctx, args);
    const existingNotes = await ctx.db
      .query("notes")
      .withIndex("by_user_lesson", (q) => q.eq("userKey", userKey))
      .filter((q) => q.eq(q.field("lessonId"), args.lessonStableId))
      .collect();
    const [existing, ...duplicates] = existingNotes.sort((left, right) => right.updatedAt - left.updatedAt);

    if (existing) {
      await ctx.db.patch(existing._id, { body: args.body, updatedAt: Date.now() });
      await Promise.all(duplicates.map((note) => ctx.db.delete(note._id)));
      return existing._id;
    }

    return await ctx.db.insert("notes", {
      userKey,
      lessonId: args.lessonStableId,
      body: args.body,
      updatedAt: Date.now(),
    });
  },
});
