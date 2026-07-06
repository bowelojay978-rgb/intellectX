"use client";

import { Button } from "@/components/ui/button";
import { type LessonBlock } from "@/data/lessons";
import { ArrowLeftIcon, ArrowRightIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

  function goToCard(nextIndex: number) {
    setCurrentIndex(nextIndex);
    setRevealed(false);
  }

  if (!currentCard) {
    return (
      <section className="animate-widget rounded-lg border border-white/70 bg-white/60 p-6 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60">
        <p className="text-muted-foreground text-sm">No flashcard-style lesson cards are available yet.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full">
      <div className="mb-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Card {currentIndex + 1} of {cards.length}
        </span>
        <Link href={`/learn/${currentCard.lessonId}#lesson-flashcards`} className="underline underline-offset-4">
          Source lesson
        </Link>
      </div>

      <article className="animate-widget min-h-80 rounded-lg border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60">
        <p className="text-muted-foreground text-sm">{currentCard.lessonTitle}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-normal text-muted-foreground">Flashcard-style review</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{getFront(currentCard)}</h2>
        <div className="my-6 rounded-lg bg-secondary/60 p-5 text-center font-medium">{getCue(currentCard)}</div>
        {revealed ? (
          <p className="text-muted-foreground text-sm leading-6">{getBack(currentCard)}</p>
        ) : (
          <p className="text-muted-foreground text-sm leading-6">Reveal the card when you are ready to check recall.</p>
        )}
      </article>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Button
            variant="outline"
            className="min-h-12"
            disabled={!hasMultipleCards || currentIndex === 0}
            onClick={() => goToCard(currentIndex - 1)}
          >
            <ArrowLeftIcon />
            Previous
          </Button>
          <Button
            variant="outline"
            className="min-h-12"
            disabled={!hasMultipleCards || currentIndex === cards.length - 1}
            onClick={() => goToCard(currentIndex + 1)}
          >
            Next
            <ArrowRightIcon />
          </Button>
        </div>
        <Button className="min-h-12 w-full sm:w-auto" onClick={() => setRevealed((value) => !value)}>
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
