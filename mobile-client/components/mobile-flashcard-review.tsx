"use client";

import type { LessonBlock } from "@/data/lessons";
import { useEffect, useState } from "react";

type FlashcardBlock = Extract<LessonBlock, { type: "visualMemoryCard" | "tapReveal" }>;

type ReviewCard = {
  lessonId: string;
  lessonTitle: string;
  block: FlashcardBlock;
};

function getFront(card: ReviewCard) {
  return card.block.type === "visualMemoryCard" ? card.block.title : card.block.prompt;
}

function getCue(card: ReviewCard) {
  return card.block.type === "visualMemoryCard" ? card.block.cue : "Tap reveal";
}

function getBack(card: ReviewCard) {
  return card.block.type === "visualMemoryCard" ? card.block.detail : card.block.explanation;
}

export function MobileFlashcardReview({ cards }: { cards: readonly ReviewCard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const currentCard = cards[currentIndex];

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, Math.max(cards.length - 1, 0)));
    setRevealed(false);
  }, [cards.length]);

  function moveTo(index: number) {
    setCurrentIndex(index);
    setRevealed(false);
  }

  if (!currentCard) {
    return (
      <section className="mobile-card mobile-empty">
        <h2>No flashcards available yet</h2>
        <p>New review cards will appear here when shared lesson content is ready.</p>
      </section>
    );
  }

  return (
    <section aria-label="Flashcard review">
      <div className="mobile-meta" aria-live="polite">
        <span className="mobile-chip">
          Card {currentIndex + 1} of {cards.length}
        </span>
        <span className="mobile-chip">{currentCard.lessonTitle}</span>
      </div>

      <article className="mobile-card flashcard-stage">
        <span className="mobile-eyebrow">Flashcard review</span>
        <h2>{getFront(currentCard)}</h2>
        <div className="flashcard-cue">{getCue(currentCard)}</div>
        <div aria-live="polite">
          {revealed ? <p>{getBack(currentCard)}</p> : <p>Reveal the card when you are ready to check recall.</p>}
        </div>
      </article>

      <div className="flashcard-actions">
        <button
          type="button"
          className="mobile-button mobile-button-secondary"
          disabled={currentIndex === 0}
          onClick={() => moveTo(currentIndex - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="mobile-button mobile-button-secondary"
          disabled={currentIndex === cards.length - 1}
          onClick={() => moveTo(currentIndex + 1)}
        >
          Next
        </button>
        <button
          type="button"
          className="mobile-button flashcard-reveal"
          onClick={() => setRevealed((value) => !value)}
          aria-pressed={revealed}
        >
          {revealed ? "Hide answer" : "Reveal answer"}
        </button>
      </div>
    </section>
  );
}
