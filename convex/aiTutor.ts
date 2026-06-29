import { actionGeneric } from "convex/server";
import { v } from "convex/values";
import type { LessonTutorResponse } from "../src/lib/ai-lesson-tutor-schema";

export const getLessonTutor = actionGeneric({
  args: {
    lessonId: v.string(),
    lessonTitle: v.string(),
    lessonSummary: v.string(),
    lessonContent: v.array(v.string()),
  },
  handler: async (_ctx, args): Promise<LessonTutorResponse> => {
    const firstContentPoint = args.lessonContent[0] ?? args.lessonSummary;

    return {
      status: "unavailable",
      lessonId: args.lessonId,
      summary: `Lesson tutor support for ${args.lessonTitle} is not configured yet.`,
      keyIdeas: [args.lessonSummary, firstContentPoint],
      checkForUnderstanding: [
        {
          question: `What is the main idea of ${args.lessonTitle}?`,
          expectedAnswer: args.lessonSummary,
        },
      ],
      commonMisconceptions: ["AI-generated tutoring is not enabled yet, so this panel only uses the lesson content."],
      nextStudyStep: "Review the lesson, try the inline checkpoint, then open the related quiz when you are ready.",
      groundedInLesson: true,
    };
  },
});
