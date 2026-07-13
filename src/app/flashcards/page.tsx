import { MobileFlashcardReview } from "@/components/education/mobile-flashcard-review";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import { lessons } from "@/data/lessons";
import { buildFlashcardReviewCards } from "@/lib/flashcard-review";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flashcards - IntellectX",
  description: "Review IntellectX lesson cards in the full web learning experience.",
};

const reviewCards = buildFlashcardReviewCards(lessons);

export default function FlashcardsPage() {
  return (
    <PageShell>
      <section className="mb-8 flex flex-col items-center gap-4 text-center">
        <Badge variant="secondary" className="uppercase">
          Flashcards
        </Badge>
        <h1 className="max-w-3xl text-4xl leading-[1.08] font-medium tracking-tight md:text-6xl">
          Flashcards for focused review
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base leading-7 md:text-lg">
          Review the visual memory cards and tap-reveal prompts already attached to IntellectX lessons.
        </p>
      </section>

      <MobileFlashcardReview cards={reviewCards} />
    </PageShell>
  );
}
