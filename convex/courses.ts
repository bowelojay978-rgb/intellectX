import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  filterLearnerVisibleCourseRecords,
  isLearnerVisibleCourseRecord,
  learnerCourseVisibilityOptions,
} from "./lib/courseWorkflow";
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
import {
  assertCourseSubmissionReady,
  assertInstructorCourseEditable,
  normalizeInstructorCourseDraftInput,
} from "./lib/instructorCourseWorkspace";
import { canManageInstructorCourse, requireAdmin, requireInstructorOrAdmin } from "./lib/staffRbac";

export const listCourses = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();

    return filterLearnerVisibleCourseRecords(courses, learnerCourseVisibilityOptions);
  },
});

export const getCourseBySlug = queryGeneric({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!course || !isLearnerVisibleCourseRecord(course, learnerCourseVisibilityOptions)) {
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

    if (!course || !isLearnerVisibleCourseRecord(course, learnerCourseVisibilityOptions)) {
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

const lessonDraftValidator = v.object({
  stableId: v.string(),
  title: v.string(),
  duration: v.string(),
  summary: v.string(),
  content: v.array(v.string()),
  videoUrl: v.optional(v.string()),
  posterUrl: v.optional(v.string()),
});

const questionDraftValidator = v.object({
  stableId: v.string(),
  prompt: v.string(),
  choices: v.array(v.string()),
  answerIndex: v.number(),
  explanation: v.string(),
});

const quizDraftValidator = v.object({
  stableId: v.string(),
  lessonStableId: v.optional(v.string()),
  title: v.string(),
  difficulty: v.string(),
  estimatedTime: v.string(),
  questions: v.array(questionDraftValidator),
});

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

async function getInstructorCourseForActorOrThrow(
  ctx: any,
  stableId: string,
  actor: ReturnType<typeof requireInstructorOrAdmin>,
) {
  const course = await getCourseByStableIdOrThrow(ctx, stableId);

  if (!canManageInstructorCourse(actor.role, course, actor.actorUserId)) {
    throw new Error("Unauthorized: instructors can only manage their own courses.");
  }

  return course;
}

async function ensureUniqueCourseIdentifiers(ctx: any, stableId: string, slug: string, excludeStableId?: string) {
  const existingStableId = await ctx.db
    .query("courses")
    .withIndex("by_stable_id", (q: any) => q.eq("stableId", stableId))
    .first();

  if (existingStableId && existingStableId.stableId !== excludeStableId) {
    throw new Error("Course stableId already exists.");
  }

  const existingSlug = await ctx.db
    .query("courses")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .first();

  if (existingSlug && existingSlug.stableId !== excludeStableId) {
    throw new Error("Course slug already exists.");
  }
}

async function writeCourseAuditLog(ctx: any, input: Parameters<typeof buildCourseWorkflowAuditLog>[0]) {
  return await ctx.db.insert("auditLogs", buildCourseWorkflowAuditLog(input));
}

async function listCourseLessons(ctx: any, stableId: string) {
  const lessons = await ctx.db
    .query("lessons")
    .withIndex("by_course_stable_id", (q: any) => q.eq("courseStableId", stableId))
    .collect();

  return lessons.sort((left: any, right: any) => left.order - right.order);
}

async function listCourseQuizzes(ctx: any, stableId: string) {
  const quizzes = await ctx.db
    .query("quizzes")
    .withIndex("by_course_stable_id", (q: any) => q.eq("courseStableId", stableId))
    .collect();

  return quizzes.sort(
    (left: any, right: any) => (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER),
  );
}

async function listQuizQuestions(ctx: any, quizStableId: string) {
  const questions = await ctx.db
    .query("questions")
    .withIndex("by_quiz_stable_id", (q: any) => q.eq("quizStableId", quizStableId))
    .collect();

  return questions.sort((left: any, right: any) => left.order - right.order);
}

async function getCourseContentForReview(ctx: any, stableId: string) {
  const lessons = await listCourseLessons(ctx, stableId);
  const quizzes = await listCourseQuizzes(ctx, stableId);
  const questions = (
    await Promise.all(quizzes.map((quiz: any) => listQuizQuestions(ctx, quiz.stableId)))
  ).flat();

  return { lessons, quizzes, questions };
}

async function replaceInstructorCourseContent(ctx: any, stableId: string, draft: ReturnType<typeof normalizeInstructorCourseDraftInput>) {
  const existingLessons = await listCourseLessons(ctx, stableId);
  const existingQuizzes = await listCourseQuizzes(ctx, stableId);

  for (const quiz of existingQuizzes) {
    const questions = await listQuizQuestions(ctx, quiz.stableId);

    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    await ctx.db.delete(quiz._id);
  }

  for (const lesson of existingLessons) {
    await ctx.db.delete(lesson._id);
  }

  for (const lesson of draft.lessons) {
    await ctx.db.insert("lessons", {
      stableId: lesson.stableId,
      courseStableId: stableId,
      title: lesson.title,
      duration: lesson.duration,
      summary: lesson.summary,
      content: lesson.content,
      accessLevel: "free",
      order: lesson.order,
      ...(lesson.videoUrl ? { videoUrl: lesson.videoUrl } : {}),
      ...(lesson.posterUrl ? { posterUrl: lesson.posterUrl } : {}),
    });
  }

  for (const quiz of draft.quizzes) {
    await ctx.db.insert("quizzes", {
      stableId: quiz.stableId,
      courseStableId: stableId,
      title: quiz.title,
      difficulty: quiz.difficulty,
      estimatedTime: quiz.estimatedTime,
      accessLevel: "free",
      order: quiz.order,
      ...(quiz.lessonStableId ? { lessonStableId: quiz.lessonStableId } : {}),
    });

    for (const question of quiz.questions) {
      await ctx.db.insert("questions", {
        stableId: question.stableId,
        quizStableId: quiz.stableId,
        prompt: question.prompt,
        choices: question.choices,
        answerIndex: question.answerIndex,
        explanation: question.explanation,
        order: question.order,
      });
    }
  }
}

export const listInstructorCourses = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireInstructorOrAdmin(identity);
    const courses = await ctx.db.query("courses").collect();
    const manageableCourses = courses.filter((course) =>
      canManageInstructorCourse(actor.role, course, actor.actorUserId),
    );

    const summaries = await Promise.all(
      manageableCourses.map(async (course) => {
        const [lessons, quizzes] = await Promise.all([
          listCourseLessons(ctx, course.stableId),
          listCourseQuizzes(ctx, course.stableId),
        ]);

        return {
          ...course,
          lessonCount: lessons.length,
          quizCount: quizzes.length,
          updatedAt: course.updatedAt ?? course.reviewedAt ?? course.submittedAt ?? course._creationTime,
        };
      }),
    );

    return summaries.sort((left, right) => right.updatedAt - left.updatedAt);
  },
});

export const getInstructorCourseDraft = queryGeneric({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireInstructorOrAdmin(identity);
    const course = await getInstructorCourseForActorOrThrow(ctx, args.stableId, actor);
    const lessons = await listCourseLessons(ctx, course.stableId);
    const quizzes = await listCourseQuizzes(ctx, course.stableId);
    const quizzesWithQuestions = await Promise.all(
      quizzes.map(async (quiz) => ({
        ...quiz,
        questions: await listQuizQuestions(ctx, quiz.stableId),
      })),
    );

    return {
      course: {
        ...course,
        updatedAt: course.updatedAt ?? course.reviewedAt ?? course.submittedAt ?? course._creationTime,
      },
      lessons,
      quizzes: quizzesWithQuestions,
    };
  },
});

export const createInstructorCourseDraft = mutationGeneric({
  args: courseDraftArgs,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireInstructorOrAdmin(identity);
    const normalized = normalizeInstructorCourseDraftInput({ ...args, lessons: [], quizzes: [] });
    const createdAt = Date.now();

    await ensureUniqueCourseIdentifiers(ctx, normalized.stableId, normalized.slug);

    const course = {
      stableId: normalized.stableId,
      slug: normalized.slug,
      title: normalized.title,
      description: normalized.description,
      subject: normalized.subject,
      level: normalized.level,
      duration: normalized.duration,
      accent: normalized.accent,
      accessLevel: "free" as const,
      reviewStatus: DRAFT,
      publicationStatus: UNPUBLISHED,
      instructorId: actor.actorUserId,
      updatedAt: createdAt,
    };

    const courseId = await ctx.db.insert("courses", course);

    await writeCourseAuditLog(ctx, {
      eventType: "course.draft_created",
      actorUserId: actor.actorUserId,
      actorRole: actor.role,
      targetId: normalized.stableId,
      createdAt,
      after: course,
    });

    return courseId;
  },
});

export const saveInstructorCourseDraft = mutationGeneric({
  args: {
    existingStableId: v.optional(v.string()),
    ...courseDraftArgs,
    lessons: v.array(lessonDraftValidator),
    quizzes: v.array(quizDraftValidator),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const actor = requireInstructorOrAdmin(identity);
    const normalized = normalizeInstructorCourseDraftInput(args);
    const updatedAt = Date.now();

    if (args.existingStableId) {
      const course = await getInstructorCourseForActorOrThrow(ctx, args.existingStableId, actor);
      assertInstructorCourseEditable(course);

      if (normalized.stableId !== course.stableId) {
        throw new Error("Course stableId is immutable after creation.");
      }

      await ensureUniqueCourseIdentifiers(ctx, normalized.stableId, normalized.slug, course.stableId);

      const patch = {
        slug: normalized.slug,
        title: normalized.title,
        description: normalized.description,
        subject: normalized.subject,
        level: normalized.level,
        duration: normalized.duration,
        accent: normalized.accent,
        updatedAt,
      };

      await ctx.db.patch(course._id, patch);
      await replaceInstructorCourseContent(ctx, course.stableId, normalized);
      await writeCourseAuditLog(ctx, {
        eventType: "course.draft_updated",
        actorUserId: actor.actorUserId,
        actorRole: actor.role,
        targetId: course.stableId,
        createdAt: updatedAt,
        before: course,
        after: { ...course, ...patch },
      });

      return course._id;
    }

    await ensureUniqueCourseIdentifiers(ctx, normalized.stableId, normalized.slug);

    const course = {
      stableId: normalized.stableId,
      slug: normalized.slug,
      title: normalized.title,
      description: normalized.description,
      subject: normalized.subject,
      level: normalized.level,
      duration: normalized.duration,
      accent: normalized.accent,
      accessLevel: "free" as const,
      reviewStatus: DRAFT,
      publicationStatus: UNPUBLISHED,
      instructorId: actor.actorUserId,
      updatedAt,
    };

    const courseId = await ctx.db.insert("courses", course);
    await replaceInstructorCourseContent(ctx, normalized.stableId, normalized);
    await writeCourseAuditLog(ctx, {
      eventType: "course.draft_created",
      actorUserId: actor.actorUserId,
      actorRole: actor.role,
      targetId: normalized.stableId,
      createdAt: updatedAt,
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
    const course = await getInstructorCourseForActorOrThrow(ctx, args.stableId, actor);

    assertCanSubmitCourseForReview(course);
    assertCourseSubmissionReady(await getCourseContentForReview(ctx, course.stableId));

    const submittedAt = Date.now();
    const patch = {
      reviewStatus: SUBMITTED_FOR_REVIEW,
      publicationStatus: UNPUBLISHED,
      submittedAt,
      updatedAt: submittedAt,
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
      updatedAt: reviewedAt,
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
      updatedAt: reviewedAt,
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
    const patch = { publicationStatus: PUBLISHED, updatedAt: publishedAt };

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
    const patch = { publicationStatus: UNPUBLISHED, updatedAt: unpublishedAt };

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
      updatedAt: archivedAt,
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
