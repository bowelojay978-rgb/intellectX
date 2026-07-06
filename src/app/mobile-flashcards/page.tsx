import { MobileFlashcardReview } from "@/components/education/mobile-flashcard-review";
import { MobileAppShell } from "@/components/education/mobile-app-shell";
import { Badge } from "@/components/ui/badge";
import { lessons, type LessonBlock } from "@/data/lessons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobile Flashcards - IntellectX",
  description: "Review IntellectX lesson cards from a focused mobile flashcard hub.",
};

type FlashcardBlock = Extract<LessonBlock, { type: "visualMemoryCard" | "tapReveal" }>;

const reviewCards = lessons.flatMap((lesson) => {
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

export default function MobileFlashcardsPage() {
  return (
    <MobileAppShell>
      <section className="mb-6 flex flex-col items-start gap-4">
        <Badge variant="secondary" className="uppercase">
          Flashcard-style review
        </Badge>
        <h1 className="text-3xl leading-[1.08] font-medium tracking-tight">Flashcards from lesson cards</h1>
        <p className="text-muted-foreground text-base leading-7">
          Review existing tap-reveal and visual memory cards in a touch-friendly flow.
        </p>
      </section>

      <MobileFlashcardReview cards={reviewCards} />
    </MobileAppShell>
  );
}
