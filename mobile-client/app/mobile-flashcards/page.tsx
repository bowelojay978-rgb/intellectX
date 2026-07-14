import { MobileFlashcardReview } from "@mobile/components/mobile-flashcard-review";
import { MobileShell } from "@mobile/components/mobile-shell";
import { bundledMobileFlashcards } from "@mobile/lib/mobile-catalog";

export default function MobileFlashcardsPage() {
  return (
    <MobileShell>
      <section className="mobile-hero">
        <span className="mobile-eyebrow">Mobile flashcards</span>
        <h1 className="mobile-title">Review with active recall</h1>
        <p className="mobile-description">
          Cards are derived from the shared lesson memory blocks, so the bundled mobile runtime does not maintain a competing flashcard source of truth.
        </p>
      </section>

      <MobileFlashcardReview cards={bundledMobileFlashcards} />
    </MobileShell>
  );
}
