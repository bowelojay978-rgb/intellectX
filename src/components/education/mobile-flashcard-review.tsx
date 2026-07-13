"use client";

import { Button } from "@/components/ui/button";
import { type LessonBlock } from "@/data/lessons";
import { ArrowLeftIcon, ArrowRightIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";

type FlashcardBlock = Extract<LessonBlock, { type: "visualMemoryCard" | "tapReveal" }>;

type ReviewCard = {
  lessonId: string;
  lessonTitle: string;
  block: FlashcardBlock;
};

type MobileFlashcardReviewProps = {
  cards: ReviewCard[];
};

function getFront(card: ReviewCard) {
  if (card.block.type === "visualMemoryCard") {
    return card.block.title;
  }

  return card.block.prompt;
}

function getBack(card: ReviewCard) {
  if (card.block.type === "visualMemoryCard") {
    return card.block.detail;
  }

  return card.block.explanation;
}

function getCue(card: ReviewCard) {
  if (card.block.type === "visualMemoryCard") {
    return card.block.cue;
  }

  return "Tap reveal";
}

export function MobileFlashcardReview({ cards }: MobileFlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const currentCard = cards[currentIndex];
  const hasMultipleCards = cards.length > 1;

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, Math.max(cards.length - 1, 0)));
    setRevealed(false);
  }, [cards.length]);

  function goToCard(nextIndex: number) {
    setCurrentIndex(nextIndex);
    setRevealed(false);
  }

  if (!currentCard) {
    return (
      <section className="animate-widget rounded-lg border border-white/70 bg-white/60 p-6 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60">
        <p className="text-muted-foreground text-sm">No flashcards are available yet.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full">
      <div className="text-muted-foreground mb-4 flex min-w-0 items-center justify-between gap-3 text-sm">
        <span className="shrink-0">
          Card {currentIndex + 1} of {cards.length}
        </span>
        <span className="min-w-0 truncate text-right">{currentCard.lessonTitle}</span>
      </div>

      <article className="animate-widget min-h-80 rounded-lg border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60">
        <p className="text-muted-foreground text-sm">{currentCard.lessonTitle}</p>
        <p className="text-muted-foreground mt-3 text-xs font-medium uppercase tracking-normal">Flashcard review</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{getFront(currentCard)}</h2>
        <div className="bg-secondary/60 my-6 rounded-lg p-5 text-center font-medium">{getCue(currentCard)}</div>
        <div aria-live="polite">
          {revealed ? (
            <p className="text-muted-foreground text-sm leading-6">{getBack(currentCard)}</p>
          ) : (
            <p className="text-muted-foreground text-sm leading-6">
              Reveal the card when you are ready to check recall.
            </p>
          )}
        </div>
      </article>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Button
            type="button"
            variant="outline"
            className="min-h-12 touch-manipulation"
            disabled={!hasMultipleCards || currentIndex === 0}
            onClick={() => goToCard(currentIndex - 1)}
          >
            <ArrowLeftIcon />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-12 touch-manipulation"
            disabled={!hasMultipleCards || currentIndex === cards.length - 1}
            onClick={() => goToCard(currentIndex + 1)}
          >
            Next
            <ArrowRightIcon />
          </Button>
        </div>
        <Button
          type="button"
          className="min-h-12 w-full touch-manipulation sm:w-auto"
          onClick={() => setRevealed((value) => !value)}
        >
          {revealed ? (
            <>
              <RotateCcwIcon />
              Hide answer
            </>
          ) : (
            "Reveal answer"
          )}
        </Button>
      </div>
    </section>
  );
}
