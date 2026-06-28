import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { lessons } from "@/data/lessons";
import { quizzes } from "@/data/quizzes";
import { featureScope, isFeatureAllowedOnMobile, type StudyFeature } from "@/lib/feature-scope";
import { BookOpenTextIcon, FileTextIcon, Layers3Icon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mobile Study - IntellectX",
  description: "A focused IntellectX mobile study entry point for quizzes, notes, and flashcards.",
};

const firstQuiz = quizzes[0];
const notesLesson = lessons.find((lesson) => lesson.id === firstQuiz?.lessonId) ?? lessons[0];
const flashcardLesson = lessons.find((lesson) =>
  lesson.blocks?.some((block) => block.type === "visualMemoryCard" || block.type === "tapReveal"),
);

type StudyItem = {
  feature: StudyFeature;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: typeof BookOpenTextIcon;
};

export default function MobileStudyPage() {
  const studyItems: StudyItem[] = [
    {
      feature: "quizzes" as const,
      title: "Quizzes",
      description: "Practice with short checks and clear explanations.",
      href: "/quizzes",
      cta: "Open quizzes",
      icon: BookOpenTextIcon,
    },
    {
      feature: "notes" as const,
      title: "Notes from lessons",
      description: "Jump to the lesson notes area and keep your study notes available locally.",
      href: notesLesson ? `/learn/${notesLesson.id}#lesson-notes` : "/quizzes",
      cta: "Open lesson notes",
      icon: FileTextIcon,
    },
    {
      feature: "flashcards" as const,
      title: "Flashcard practice",
      description: "Use the existing tap-reveal and visual memory cards inside lesson study blocks.",
      href: flashcardLesson ? `/learn/${flashcardLesson.id}#lesson-flashcards` : "/quizzes",
      cta: "Open lesson cards",
      icon: Layers3Icon,
    },
  ].filter((item) => isFeatureAllowedOnMobile(item.feature));

  return (
    <PageShell>
      <section className="mb-10 flex flex-col items-center gap-5 text-center">
        <Badge variant="secondary" className="uppercase">
          Mobile study
        </Badge>
        <h1 className="max-w-3xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
          Study essentials for the mobile app
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-6 md:text-lg">
          A focused entry point for the mobile IntellectX experience: quizzes, notes, and flashcards.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {studyItems.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.feature}
              className="animate-widget flex min-h-72 flex-col rounded-lg border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60"
            >
              <span className="bg-primary text-primary-foreground grid size-11 place-items-center rounded-full">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">{item.title}</h2>
              <p className="text-muted-foreground mt-3 flex-1 text-sm leading-6">{item.description}</p>
              <Button className="mt-6" asChild>
                <Link href={item.href}>{item.cta}</Link>
              </Button>
            </article>
          );
        })}
      </section>

      <p className="text-muted-foreground mt-8 text-center text-sm">
        Mobile scope: {featureScope.mobileStudyFeatures.join(", ")}.
      </p>
    </PageShell>
  );
}
