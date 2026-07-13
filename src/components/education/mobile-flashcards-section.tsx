"use client";

import { MobileFlashcardReview } from "@/components/education/mobile-flashcard-review";
import { AppLoadingSpinner } from "@/components/ui/app-loading-spinner";
import { buildFlashcardReviewCards } from "@/lib/flashcard-review";
import { useLearnerCatalog } from "@/lib/learner-catalog-client";
import { useMemo } from "react";

export function MobileFlashcardsSection() {
  const catalog = useLearnerCatalog();
  const cards = useMemo(() => buildFlashcardReviewCards(catalog.lessons), [catalog.lessons]);

  if (catalog.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <AppLoadingSpinner label="Loading mobile flashcards" showLabel />
      </div>
    );
  }

  return <MobileFlashcardReview cards={cards} />;
}
