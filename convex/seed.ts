import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

const courses = [
  {
    stableId: "ai-study-systems",
    slug: "ai-study-systems",
    title: "AI Study Systems",
    description: "Build a reliable study workflow with AI tutors, retrieval practice, and weekly planning.",
    subject: "AI Productivity",
    level: "Beginner",
    duration: "4h 20m",
    accent: "from-sky-500/20 via-white to-emerald-400/20",
  },
  {
    stableId: "critical-thinking",
    slug: "critical-thinking",
    title: "Critical Thinking Lab",
    description: "Practice evidence checks, argument mapping, and bias detection with guided AI feedback.",
    subject: "Reasoning",
    level: "Intermediate",
    duration: "5h 10m",
    accent: "from-violet-500/20 via-white to-amber-300/20",
  },
  {
    stableId: "exam-accelerator",
    slug: "exam-accelerator",
    title: "Exam Accelerator",
    description: "Turn course notes into adaptive revision plans, timed drills, and confidence tracking.",
    subject: "Exam Prep",
    level: "Advanced",
    duration: "6h 45m",
    accent: "from-rose-400/20 via-white to-cyan-400/20",
  },
];

const lessons = [
  {
    stableId: "prompting-for-learning",
    courseStableId: "ai-study-systems",
    title: "Prompting for Learning",
    duration: "18 min",
    summary: "Use AI prompts that explain, challenge, and test instead of simply producing answers.",
    content: [
      "A strong learning prompt gives the AI a role, a target outcome, and a constraint.",
      "Replace broad requests with focused loops: explain, question, diagnose, and suggest one next step.",
    ],
    posterUrl: "/app-image-1.png",
    order: 1,
  },
  {
    stableId: "memory-systems",
    courseStableId: "ai-study-systems",
    title: "Memory Systems",
    duration: "22 min",
    summary: "Combine spaced repetition and active recall into a weekly routine.",
    content: ["Memory improves when retrieval is effortful.", "Schedule reviews before confidence drops too far."],
    posterUrl: "/app-image-1.png",
    order: 2,
  },
  {
    stableId: "argument-maps",
    courseStableId: "critical-thinking",
    title: "Argument Maps",
    duration: "24 min",
    summary: "Break claims into evidence, assumptions, objections, and implications.",
    content: ["An argument map separates the main claim from the reasons that support it."],
    posterUrl: "/app-image-1.png",
    order: 1,
  },
  {
    stableId: "diagnostic-review",
    courseStableId: "exam-accelerator",
    title: "Diagnostic Review",
    duration: "26 min",
    summary: "Find the highest-value gaps before building an exam plan.",
    content: ["Start with a timed diagnostic, not a reread."],
    posterUrl: "/app-image-1.png",
    order: 1,
  },
];

const quizzes = [
  {
    stableId: "ai-study-systems-check",
    courseStableId: "ai-study-systems",
    lessonStableId: "prompting-for-learning",
    title: "AI Study Systems Check",
    difficulty: "Foundational",
    estimatedTime: "6 min",
    questions: [
      {
        stableId: "ai-study-systems-check-q1",
        prompt: "Which prompt pattern best supports learning?",
        choices: [
          "Give me the final answer only.",
          "Explain, question me, diagnose gaps, then suggest one next step.",
          "Rewrite my notes in a longer format.",
          "Summarize every topic with no follow-up.",
        ],
        answerIndex: 1,
        explanation: "A learning loop creates feedback and retrieval practice.",
        order: 1,
      },
    ],
  },
];

async function exists(ctx: any, table: string, stableId: string) {
  return await ctx.db
    .query(table)
    .withIndex("by_stable_id", (q: any) => q.eq("stableId", stableId))
    .first();
}

export const seedEducationCatalog = mutationGeneric({
  args: { reset: v.optional(v.boolean()) },
  handler: async (ctx) => {
    for (const course of courses) {
      if (!(await exists(ctx, "courses", course.stableId))) {
        await ctx.db.insert("courses", course);
      }
    }

    for (const lesson of lessons) {
      if (!(await exists(ctx, "lessons", lesson.stableId))) {
        await ctx.db.insert("lessons", lesson);
      }
    }

    for (const quiz of quizzes) {
      if (!(await exists(ctx, "quizzes", quiz.stableId))) {
        const { questions, ...quizDoc } = quiz;
        await ctx.db.insert("quizzes", quizDoc);
        for (const question of questions) {
          if (!(await exists(ctx, "questions", question.stableId))) {
            await ctx.db.insert("questions", { ...question, quizStableId: quiz.stableId });
          }
        }
      }
    }

    return { courses: courses.length, lessons: lessons.length, quizzes: quizzes.length };
  },
});
