import { courses } from "../src/data/courses";
import { lessons } from "../src/data/lessons";
import { quizzes } from "../src/data/quizzes";
import { internalMutationGeneric } from "convex/server";
import { v } from "convex/values";
import {
  shouldRemoveObsoleteSeedManagedCatalogRecord,
  shouldRunSeedCleanup,
} from "./lib/seedCatalogSafety";
import { getSeedQuizAnswer } from "./seedQuizAnswers";

type CatalogTable = "courses" | "lessons" | "quizzes" | "questions";

const courseDocs = courses.map((course) => ({
  stableId: course.id,
  slug: course.slug,
  title: course.title,
  description: course.description,
  subject: course.subject,
  level: course.level,
  duration: course.duration,
  accent: course.accent,
  reviewStatus: course.reviewStatus,
  publicationStatus: course.publicationStatus,
  seedManaged: true,
}));

const lessonDocs = lessons.map((lesson) => ({
  stableId: lesson.id,
  courseStableId: lesson.courseId,
  title: lesson.title,
  duration: lesson.duration,
  summary: lesson.summary,
  content: lesson.content,
  ...(lesson.videoUrl ? { videoUrl: lesson.videoUrl } : {}),
  ...(lesson.posterUrl ? { posterUrl: lesson.posterUrl } : {}),
  order: (courses.find((course) => course.id === lesson.courseId)?.lessonIds.indexOf(lesson.id) ?? -1) + 1,
  seedManaged: true,
}));

const quizDocs = quizzes.map((quiz) => ({
  stableId: quiz.id,
  courseStableId: quiz.courseId,
  ...(quiz.lessonId ? { lessonStableId: quiz.lessonId } : {}),
  title: quiz.title,
  difficulty: quiz.difficulty,
  estimatedTime: quiz.estimatedTime,
  seedManaged: true,
}));

const questionDocs = quizzes.flatMap((quiz) =>
  quiz.questions.map((question, index) => {
    const answer = getSeedQuizAnswer(quiz.id, question.id);

    return {
      stableId: `${quiz.id}-${question.id}`,
      quizStableId: quiz.id,
      prompt: question.prompt,
      choices: question.choices,
      answerIndex: answer.answerIndex,
      explanation: answer.explanation,
      order: index,
      seedManaged: true,
    };
  }),
);

async function getByStableId(ctx: any, table: CatalogTable, stableId: string) {
  return await ctx.db
    .query(table)
    .withIndex("by_stable_id", (q: any) => q.eq("stableId", stableId))
    .first();
}

async function upsertByStableId(ctx: any, table: CatalogTable, doc: { stableId: string }) {
  const existing = await getByStableId(ctx, table, doc.stableId);

  if (existing) {
    await ctx.db.patch(existing._id, doc);
    return "updated";
  }

  await ctx.db.insert(table, doc);
  return "inserted";
}

async function removeObsoleteSeedManagedCatalogDocs(ctx: any, table: CatalogTable, stableIds: Set<string>) {
  const docs = await ctx.db.query(table).collect();
  let removed = 0;

  for (const doc of docs) {
    if (shouldRemoveObsoleteSeedManagedCatalogRecord(doc, stableIds)) {
      await ctx.db.delete(doc._id);
      removed += 1;
    }
  }

  return removed;
}

export const seedEducationCatalog = internalMutationGeneric({
  args: { reset: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const counts = {
      courses: { seeded: courseDocs.length, inserted: 0, updated: 0, removed: 0 },
      lessons: { seeded: lessonDocs.length, inserted: 0, updated: 0, removed: 0 },
      quizzes: { seeded: quizDocs.length, inserted: 0, updated: 0, removed: 0 },
      questions: { seeded: questionDocs.length, inserted: 0, updated: 0, removed: 0 },
    };

    for (const course of courseDocs) {
      const result = await upsertByStableId(ctx, "courses", course);
      counts.courses[result] += 1;
    }

    for (const lesson of lessonDocs) {
      const result = await upsertByStableId(ctx, "lessons", lesson);
      counts.lessons[result] += 1;
    }

    for (const quiz of quizDocs) {
      const result = await upsertByStableId(ctx, "quizzes", quiz);
      counts.quizzes[result] += 1;
    }

    for (const question of questionDocs) {
      const result = await upsertByStableId(ctx, "questions", question);
      counts.questions[result] += 1;
    }

    if (shouldRunSeedCleanup(args.reset)) {
      counts.questions.removed = await removeObsoleteSeedManagedCatalogDocs(
        ctx,
        "questions",
        new Set(questionDocs.map((question) => question.stableId)),
      );
      counts.quizzes.removed = await removeObsoleteSeedManagedCatalogDocs(
        ctx,
        "quizzes",
        new Set(quizDocs.map((quiz) => quiz.stableId)),
      );
      counts.lessons.removed = await removeObsoleteSeedManagedCatalogDocs(
        ctx,
        "lessons",
        new Set(lessonDocs.map((lesson) => lesson.stableId)),
      );
      counts.courses.removed = await removeObsoleteSeedManagedCatalogDocs(
        ctx,
        "courses",
        new Set(courseDocs.map((course) => course.stableId)),
      );
    }

    return counts;
  },
});
