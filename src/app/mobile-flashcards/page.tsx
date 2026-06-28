import { TapReveal } from "@/components/education/tap-reveal";
import { VisualMemoryCard } from "@/components/education/visual-memory-card";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { lessons, type LessonBlock } from "@/data/lessons";
import { ArrowRightIcon, Layers3Icon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mobile Flashcards - IntellectX",
  description: "A mobile IntellectX hub for flashcard-style lesson review.",
};

type FlashcardBlock = Extract<LessonBlock, { type: "visualMemoryCard" | "tapReveal" }>;

const flashcardLessons = lessons.flatMap((lesson) => {
  const blocks =
    lesson.blocks?.filter(
      (block): block is FlashcardBlock => block.type === "visualMemoryCard" || block.type === "tapReveal",
    ) ?? [];

  return blocks.length > 0 ? [{ lesson, blocks }] : [];
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

      <section className="space-y-5">
        {flashcardLessons.map(({ lesson, blocks }) => (
          <article
            key={lesson.id}
            className="animate-widget rounded-lg border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60"
          >
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Layers3Icon className="size-4" />
                  {blocks.length} review cards
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">{lesson.title}</h2>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/learn/${lesson.id}#lesson-flashcards`}>
                  Open in lesson
                  <ArrowRightIcon />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {blocks.map((block, index) => {
                if (block.type === "visualMemoryCard") {
                  return <VisualMemoryCard key={`${lesson.id}-${index}`} {...block} />;
                }

                return <TapReveal key={`${lesson.id}-${index}`} {...block} />;
              })}
            </div>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
