import { MobileFlashcardReview } from "@/components/education/mobile-flashcard-review";
import { MobileAppShell } from "@/components/education/mobile-app-shell";
import { Badge } from "@/components/ui/badge";
import { lessons } from "@/data/lessons";
import { buildFlashcardReviewCards } from "@/lib/flashcard-review";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobile Flashcards - IntellectX",
  description: "Review IntellectX lesson cards from a focused mobile flashcard hub.",
};

const reviewCards = buildFlashcardReviewCards(lessons);

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
