import { MobileAppShell } from "@/components/education/mobile-app-shell";
import { MobileFlashcardsSection } from "@/components/education/mobile-flashcards-section";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobile Flashcards - IntellectX",
  description: "Review IntellectX lesson cards from a focused mobile flashcard hub.",
};

export default function MobileFlashcardsPage() {
  return (
    <MobileAppShell>
      <section className="mb-6 flex flex-col items-start gap-4">
        <Badge variant="secondary" className="uppercase">
          Mobile flashcards
        </Badge>
        <h1 className="text-3xl leading-[1.08] font-medium tracking-tight">Flashcards from lesson cards</h1>
        <p className="text-muted-foreground text-base leading-7">
          Tap to reveal answers, revisit key ideas, and move through cards one at a time.
        </p>
      </section>

      <MobileFlashcardsSection />
    </MobileAppShell>
  );
}
