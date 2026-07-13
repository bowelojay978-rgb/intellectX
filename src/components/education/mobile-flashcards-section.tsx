"use client";

import { MobileFlashcardReview } from "@/components/education/mobile-flashcard-review";
import { AppLoadingSpinner } from "@/components/ui/app-loading-spinner";
import { convexEnv } from "@/lib/education-data";
import { buildFlashcardReviewCards } from "@/lib/flashcard-review";
import { buildLearnerCatalog, type LearnerCatalog, useLearnerCatalog } from "@/lib/learner-catalog-client";
import { useMemo } from "react";

export function MobileFlashcardsSection() {
  if (!convexEnv.isConfigured) {
    return <MobileFlashcardsContent catalog={buildLearnerCatalog()} />;
  }

  return <ConvexMobileFlashcardsSection />;
}

function ConvexMobileFlashcardsSection() {
  const catalog = useLearnerCatalog();
  return <MobileFlashcardsContent catalog={catalog} />;
}

function MobileFlashcardsContent({ catalog }: { catalog: LearnerCatalog }) {
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
