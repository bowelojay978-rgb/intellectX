import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertInstructorCourseEditable } from "./lib/instructorCourseWorkspace";
import {
  STAFF_MEDIA_POSTER,
  STAFF_MEDIA_VIDEO,
  assertStaffMediaMetadata,
} from "./lib/staffMediaPolicy";
import { canManageInstructorCourse, requireInstructorOrAdmin } from "./lib/staffRbac";

const staffMediaKindValidator = v.union(v.literal(STAFF_MEDIA_VIDEO), v.literal(STAFF_MEDIA_POSTER));

async function getManageableCourse(ctx: any, stableId: string, actor: ReturnType<typeof requireInstructorOrAdmin>) {
  const course = await ctx.db
    .query("courses")
    .withIndex("by_stable_id", (q: any) => q.eq("stableId", stableId))
    .first();

  if (!course) {
    throw new Error("Course not found.");
  }

  if (!canManageInstructorCourse(actor.role, course, actor.actorUserId)) {
    throw new Error("Unauthorized: instructors can only manage their own courses.");
  }

  return course;
}

async function getCourseLesson(ctx: any, courseStableId: string, lessonStableId: string) {
  const lesson = await ctx.db
    .query("lessons")
    .withIndex("by_stable_id", (q: any) => q.eq("stableId", lessonStableId))
    .first();

  if (!lesson || lesson.courseStableId !== courseStableId) {
    throw new Error("Lesson not found in this course.");
  }

  return lesson;
}

async function listLessonAttachments(ctx: any, courseStableId: string, lessonStableId: string) {
  return await ctx.db
    .query("staffMediaUploads")
    .withIndex("by_course_lesson", (q: any) =>
      q.eq("courseStableId", courseStableId).eq("lessonStableId", lessonStableId),
    )
    .collect();
}

async function mediaRecordWithUrl(ctx: any, record: any) {
  return {
    storageId: record.storageId,
    kind: record.kind,
    contentType: record.contentType,
    size: record.size,
    url: await ctx.storage.getUrl(record.storageId),
  };
}

export const generateStaffMediaUploadUrl = mutationGeneric({
  args: { courseStableId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireInstructorOrAdmin(identity);
    const course = await getManageableCourse(ctx, args.courseStableId, actor);
    assertInstructorCourseEditable(course);
    return await ctx.storage.generateUploadUrl();
  },
});

export const registerStaffMediaUpload = mutationGeneric({
  args: {
    storageId: v.id("_storage"),
    kind: staffMediaKindValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireInstructorOrAdmin(identity);
    const metadata = await ctx.db.system.get("_storage", args.storageId);

    if (!metadata) {
      throw new Error("Uploaded media could not be found in Convex storage.");
    }

    const validated = assertStaffMediaMetadata(args.kind, {
      contentType: metadata.contentType,
      size: metadata.size,
    });

    const existing = await ctx.db
      .query("staffMediaUploads")
      .withIndex("by_storage_id", (q: any) => q.eq("storageId", args.storageId))
      .first();

    if (existing) {
      if (existing.uploadedBy !== actor.actorUserId || existing.kind !== args.kind) {
        throw new Error("Uploaded media is already registered to another staff context.");
      }

      return existing._id;
    }

    return await ctx.db.insert("staffMediaUploads", {
      storageId: args.storageId,
      uploadedBy: actor.actorUserId,
      uploaderRole: actor.role,
      kind: args.kind,
      contentType: validated.contentType,
      size: validated.size,
      createdAt: Date.now(),
    });
  },
});

export const listInstructorLessonMedia = queryGeneric({
  args: { courseStableId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireInstructorOrAdmin(identity);
    await getManageableCourse(ctx, args.courseStableId, actor);

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course_stable_id", (q: any) => q.eq("courseStableId", args.courseStableId))
      .collect();

    return await Promise.all(
      lessons
        .sort((left: any, right: any) => left.order - right.order)
        .map(async (lesson: any) => {
          const attachments = await listLessonAttachments(ctx, args.courseStableId, lesson.stableId);
          const video = attachments
            .filter((record: any) => record.kind === STAFF_MEDIA_VIDEO)
            .sort((left: any, right: any) => right.attachedAt - left.attachedAt)[0];
          const poster = attachments
            .filter((record: any) => record.kind === STAFF_MEDIA_POSTER)
            .sort((left: any, right: any) => right.attachedAt - left.attachedAt)[0];

          return {
            stableId: lesson.stableId,
            title: lesson.title,
            order: lesson.order,
            externalVideoUrl: lesson.videoUrl ?? null,
            externalPosterUrl: lesson.posterUrl ?? null,
            video: video ? await mediaRecordWithUrl(ctx, video) : null,
            poster: poster ? await mediaRecordWithUrl(ctx, poster) : null,
          };
        }),
    );
  },
});

export const attachLessonMedia = mutationGeneric({
  args: {
    courseStableId: v.string(),
    lessonStableId: v.string(),
    storageId: v.id("_storage"),
    kind: staffMediaKindValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireInstructorOrAdmin(identity);
    const course = await getManageableCourse(ctx, args.courseStableId, actor);
    assertInstructorCourseEditable(course);
    await getCourseLesson(ctx, args.courseStableId, args.lessonStableId);

    const upload = await ctx.db
      .query("staffMediaUploads")
      .withIndex("by_storage_id", (q: any) => q.eq("storageId", args.storageId))
      .first();

    if (!upload || upload.kind !== args.kind) {
      throw new Error("Registered staff media of the requested type was not found.");
    }

    if (actor.role !== "admin" && upload.uploadedBy !== actor.actorUserId) {
      throw new Error("Unauthorized: instructors may only attach media they uploaded.");
    }

    const existingAttachments = await listLessonAttachments(ctx, args.courseStableId, args.lessonStableId);

    for (const existing of existingAttachments) {
      if (existing.kind === args.kind && existing.storageId !== args.storageId) {
        await ctx.storage.delete(existing.storageId);
        await ctx.db.delete(existing._id);
      }
    }

    const attachedAt = Date.now();
    await ctx.db.patch(upload._id, {
      courseStableId: args.courseStableId,
      lessonStableId: args.lessonStableId,
      attachedAt,
    });

    await ctx.db.insert("auditLogs", {
      eventType: "lesson.media_attached",
      actorUserId: actor.actorUserId,
      actorRole: actor.role,
      targetType: "lesson",
      targetId: args.lessonStableId,
      createdAt: attachedAt,
      after: {
        courseStableId: args.courseStableId,
        kind: args.kind,
        storageId: args.storageId,
        contentType: upload.contentType,
        size: upload.size,
      },
    });

    return upload._id;
  },
});

export const removeLessonMedia = mutationGeneric({
  args: {
    courseStableId: v.string(),
    lessonStableId: v.string(),
    kind: staffMediaKindValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireInstructorOrAdmin(identity);
    const course = await getManageableCourse(ctx, args.courseStableId, actor);
    assertInstructorCourseEditable(course);
    await getCourseLesson(ctx, args.courseStableId, args.lessonStableId);

    const attachments = await listLessonAttachments(ctx, args.courseStableId, args.lessonStableId);
    const targets = attachments.filter((record: any) => record.kind === args.kind);

    for (const target of targets) {
      await ctx.storage.delete(target.storageId);
      await ctx.db.delete(target._id);
    }

    if (targets.length > 0) {
      await ctx.db.insert("auditLogs", {
        eventType: "lesson.media_removed",
        actorUserId: actor.actorUserId,
        actorRole: actor.role,
        targetType: "lesson",
        targetId: args.lessonStableId,
        createdAt: Date.now(),
        before: {
          courseStableId: args.courseStableId,
          kind: args.kind,
          removedCount: targets.length,
        },
      });
    }

    return targets.length;
  },
});
