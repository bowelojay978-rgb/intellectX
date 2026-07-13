import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/staffRbac";

async function listCourseLessons(ctx: any, stableId: string) {
  return (
    await ctx.db
      .query("lessons")
      .withIndex("by_course_stable_id", (q: any) => q.eq("courseStableId", stableId))
      .collect()
  ).sort((left: any, right: any) => left.order - right.order);
}

async function listCourseQuizzes(ctx: any, stableId: string) {
  return (
    await ctx.db
      .query("quizzes")
      .withIndex("by_course_stable_id", (q: any) => q.eq("courseStableId", stableId))
      .collect()
  ).sort(
    (left: any, right: any) =>
      (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER),
  );
}

async function listQuizQuestions(ctx: any, quizStableId: string) {
  return (
    await ctx.db
      .query("questions")
      .withIndex("by_quiz_stable_id", (q: any) => q.eq("quizStableId", quizStableId))
      .collect()
  ).sort((left: any, right: any) => left.order - right.order);
}

async function resolveLessonMedia(ctx: any, lesson: any) {
  const attachments = await ctx.db
    .query("staffMediaUploads")
    .withIndex("by_course_lesson", (q: any) =>
      q.eq("courseStableId", lesson.courseStableId).eq("lessonStableId", lesson.stableId),
    )
    .collect();
  const video = attachments
    .filter((record: any) => record.kind === "video")
    .sort((left: any, right: any) => right.attachedAt - left.attachedAt)[0];
  const poster = attachments
    .filter((record: any) => record.kind === "poster")
    .sort((left: any, right: any) => right.attachedAt - left.attachedAt)[0];

  return {
    ...lesson,
    videoUrl: video ? await ctx.storage.getUrl(video.storageId) : lesson.videoUrl,
    posterUrl: poster ? await ctx.storage.getUrl(poster.storageId) : lesson.posterUrl,
    videoUpload: video
      ? {
          storageId: video.storageId,
          contentType: video.contentType,
          size: video.size,
        }
      : null,
    posterUpload: poster
      ? {
          storageId: poster.storageId,
          contentType: poster.contentType,
          size: poster.size,
        }
      : null,
  };
}

export const listAdminCourses = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    requireAdmin(identity);

    const courses = await ctx.db.query("courses").collect();
    const summaries = await Promise.all(
      courses.map(async (course: any) => {
        const [lessons, quizzes] = await Promise.all([
          listCourseLessons(ctx, course.stableId),
          listCourseQuizzes(ctx, course.stableId),
        ]);

        return {
          ...course,
          lessonCount: lessons.length,
          quizCount: quizzes.length,
          updatedAt:
            course.updatedAt ?? course.reviewedAt ?? course.submittedAt ?? course._creationTime,
        };
      }),
    );

    return summaries.sort((left, right) => right.updatedAt - left.updatedAt);
  },
});

export const getAdminCourseReview = queryGeneric({
  args: { stableId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    requireAdmin(identity);

    const course = await ctx.db
      .query("courses")
      .withIndex("by_stable_id", (q: any) => q.eq("stableId", args.stableId))
      .first();

    if (!course) {
      return null;
    }

    const rawLessons = await listCourseLessons(ctx, course.stableId);
    const lessons = await Promise.all(rawLessons.map((lesson: any) => resolveLessonMedia(ctx, lesson)));
    const quizzes = await listCourseQuizzes(ctx, course.stableId);
    const quizzesWithQuestions = await Promise.all(
      quizzes.map(async (quiz: any) => ({
        ...quiz,
        questions: await listQuizQuestions(ctx, quiz.stableId),
      })),
    );
    const auditLogs = (
      await ctx.db
        .query("auditLogs")
        .withIndex("by_target", (q: any) => q.eq("targetType", "course").eq("targetId", course.stableId))
        .collect()
    ).sort((left: any, right: any) => right.createdAt - left.createdAt);

    return {
      course: {
        ...course,
        updatedAt:
          course.updatedAt ?? course.reviewedAt ?? course.submittedAt ?? course._creationTime,
      },
      lessons,
      quizzes: quizzesWithQuestions,
      auditLogs,
    };
  },
});
