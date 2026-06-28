import { MobileFlashcardReview } from "@/components/education/mobile-flashcard-review";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import { lessons, type LessonBlock } from "@/data/lessons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobile Flashcards - IntellectX",
  description: "A mobile IntellectX hub for flashcard-style lesson review.",
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
    <PageShell>
      <section className="mb-10 flex flex-col items-center gap-5 text-center">
        <Badge variant="secondary" className="uppercase">
          Flashcard-style review
        </Badge>
        <h1 className="max-w-3xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
          Flashcards from lesson cards
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-6 md:text-lg">
          A mobile review hub backed by existing tap-reveal and visual memory cards. Spaced repetition and analytics can
          come later without changing the lesson content model today.
        </p>
      </section>

      <MobileFlashcardReview cards={reviewCards} />
    </PageShell>
  );
}
