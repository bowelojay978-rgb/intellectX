import type { Lesson, LessonBlock } from "@/data/lessons";

type FlashcardBlock = Extract<LessonBlock, { type: "visualMemoryCard" | "tapReveal" }>;

export function buildFlashcardReviewCards(sourceLessons: readonly Lesson[]) {
  return sourceLessons.flatMap((lesson) => {
    const blocks =
      lesson.blocks?.filter(
        (block): block is FlashcardBlock => block.type === "visualMemoryCard" || block.type === "tapReveal",
      ) ?? [];

    return blocks.map((block) => ({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      block,
    }));
  });
}
