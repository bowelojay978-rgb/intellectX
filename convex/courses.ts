import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { filterLearnerVisibleCourseRecords, isLearnerVisibleCourseRecord } from "./lib/courseWorkflow";
import {
  APPROVED,
  ARCHIVED,
  CHANGES_REQUESTED,
  DRAFT,
  PUBLISHED,
  SUBMITTED_FOR_REVIEW,
  UNPUBLISHED,
  assertCanApproveCourse,
  assertCanPublishCourse,
  assertCanRequestCourseChanges,
  assertCanSubmitCourseForReview,
  assertCanUnpublishCourse,
  buildCourseWorkflowAuditLog,
} from "./lib/courseWorkflowMutations";
import { canManageInstructorCourse, requireAdmin, requireInstructorOrAdmin } from "./lib/staffRbac";

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

const courseDraftArgs = {
  stableId: v.string(),
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  subject: v.string(),
  level: v.string(),
  duration: v.string(),
  accent: v.string(),
};

async function getCourseByStableIdOrThrow(ctx: any, stableId: string) {
  const course = await ctx.db
    .query("courses")
    .withIndex("by_stable_id", (q: any) => q.eq("stableId", stableId))
    .first();

  if (!course) {
    throw new Error("Course not found.");
  }

  return course;
}

async function ensureUniqueCourseIdentifiers(ctx: any, stableId: string, slug: string) {
  const existingStableId = await ctx.db
    .query("courses")
    .withIndex("by_stable_id", (q: any) => q.eq("stableId", stableId))
    .first();

  if (existingStableId) {
    throw new Error("Course stableId already exists.");
  }

  const existingSlug = await ctx.db
    .query("courses")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .first();

  if (existingSlug) {
    throw new Error("Course slug already exists.");
  }
}

async function writeCourseAuditLog(ctx: any, input: Parameters<typeof buildCourseWorkflowAuditLog>[0]) {
  return await ctx.db.insert("auditLogs", buildCourseWorkflowAuditLog(input));
}

export const createInstructorCourseDraft = mutationGeneric({
  args: courseDraftArgs,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireInstructorOrAdmin(identity);
    const createdAt = Date.now();

    await ensureUniqueCourseIdentifiers(ctx, args.stableId, args.slug);

    const course = {
      stableId: args.stableId,
      slug: args.slug,
      title: args.title,
      description: args.description,
      subject: args.subject,
      level: args.level,
      duration: args.duration,
      accent: args.accent,
      reviewStatus: DRAFT,
      publicationStatus: UNPUBLISHED,
      instructorId: actor.actorUserId,
    };

    const courseId = await ctx.db.insert("courses", course);

    await writeCourseAuditLog(ctx, {
      eventType: "course.draft_created",
      actorUserId: actor.actorUserId,
      actorRole: actor.role,
      targetId: args.stableId,
      createdAt,
      after: course,
    });

    return courseId;
  },
});

export const submitCourseForReview = mutationGeneric({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireInstructorOrAdmin(identity);
    const course = await getCourseByStableIdOrThrow(ctx, args.stableId);

    if (!canManageInstructorCourse(actor.role, course, actor.actorUserId)) {
      throw new Error("Unauthorized: instructors can only manage their own courses.");
    }

    assertCanSubmitCourseForReview(course);

    const submittedAt = Date.now();
    const patch = {
      reviewStatus: SUBMITTED_FOR_REVIEW,
      publicationStatus: UNPUBLISHED,
      submittedAt,
    };

    await ctx.db.patch(course._id, patch);
    await writeCourseAuditLog(ctx, {
      eventType: "course.submitted_for_review",
      actorUserId: actor.actorUserId,
      actorRole: actor.role,
      targetId: course.stableId,
      createdAt: submittedAt,
      before: course,
      after: { ...course, ...patch },
    });

    return course._id;
  },
});

export const requestCourseChanges = mutationGeneric({
  args: { stableId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireAdmin(identity);
    const course = await getCourseByStableIdOrThrow(ctx, args.stableId);
    const reason = args.reason.trim();

    if (!reason) {
      throw new Error("A change-request reason is required.");
    }

    assertCanRequestCourseChanges(course);

    const reviewedAt = Date.now();
    const patch = {
      reviewStatus: CHANGES_REQUESTED,
      publicationStatus: UNPUBLISHED,
      reviewedAt,
      reviewedBy: actor.actorUserId,
      reviewReason: reason,
    };

    await ctx.db.patch(course._id, patch);
    await writeCourseAuditLog(ctx, {
      eventType: "course.changes_requested",
      actorUserId: actor.actorUserId,
      actorRole: actor.role,
      targetId: course.stableId,
      createdAt: reviewedAt,
      reason,
      before: course,
      after: { ...course, ...patch },
    });

    return course._id;
  },
});

export const approveCourse = mutationGeneric({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireAdmin(identity);
    const course = await getCourseByStableIdOrThrow(ctx, args.stableId);

    assertCanApproveCourse(course);

    const reviewedAt = Date.now();
    const patch = {
      reviewStatus: APPROVED,
      publicationStatus: UNPUBLISHED,
      reviewedAt,
      reviewedBy: actor.actorUserId,
    };

    await ctx.db.patch(course._id, patch);
    await writeCourseAuditLog(ctx, {
      eventType: "course.approved",
      actorUserId: actor.actorUserId,
      actorRole: actor.role,
      targetId: course.stableId,
      createdAt: reviewedAt,
      before: course,
      after: { ...course, ...patch },
    });

    return course._id;
  },
});

export const publishCourse = mutationGeneric({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireAdmin(identity);
    const course = await getCourseByStableIdOrThrow(ctx, args.stableId);

    assertCanPublishCourse(course);

    const publishedAt = Date.now();
    const patch = { publicationStatus: PUBLISHED };

    await ctx.db.patch(course._id, patch);
    await writeCourseAuditLog(ctx, {
      eventType: "course.published",
      actorUserId: actor.actorUserId,
      actorRole: actor.role,
      targetId: course.stableId,
      createdAt: publishedAt,
      before: course,
      after: { ...course, ...patch },
    });

    return course._id;
  },
});

export const unpublishCourse = mutationGeneric({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireAdmin(identity);
    const course = await getCourseByStableIdOrThrow(ctx, args.stableId);

    assertCanUnpublishCourse(course);

    const unpublishedAt = Date.now();
    const patch = { publicationStatus: UNPUBLISHED };

    await ctx.db.patch(course._id, patch);
    await writeCourseAuditLog(ctx, {
      eventType: "course.unpublished",
      actorUserId: actor.actorUserId,
      actorRole: actor.role,
      targetId: course.stableId,
      createdAt: unpublishedAt,
      before: course,
      after: { ...course, ...patch },
    });

    return course._id;
  },
});

export const archiveCourse = mutationGeneric({
  args: { stableId: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireAdmin(identity);
    const course = await getCourseByStableIdOrThrow(ctx, args.stableId);
    const reason = args.reason?.trim();
    const archivedAt = Date.now();
    const patch = {
      reviewStatus: ARCHIVED,
      publicationStatus: ARCHIVED,
      ...(reason ? { reviewReason: reason } : {}),
    };

    await ctx.db.patch(course._id, patch);
    await writeCourseAuditLog(ctx, {
      eventType: "course.archived",
      actorUserId: actor.actorUserId,
      actorRole: actor.role,
      targetId: course.stableId,
      createdAt: archivedAt,
      ...(reason ? { reason } : {}),
      before: course,
      after: { ...course, ...patch },
    });

    return course._id;
  },
});
