import { MobileAppShell } from "@/components/education/mobile-app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { featureScope, isFeatureAllowedOnMobile, type StudyFeature } from "@/lib/feature-scope";
import { BookOpenTextIcon, Layers3Icon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mobile Study - IntellectX",
  description: "Open IntellectX mobile study tools for quizzes and flashcard-style review.",
};

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
      description: "Open the mobile quiz hub and practice with the existing quiz system.",
      href: "/mobile-quizzes",
      cta: "Open quizzes",
      icon: BookOpenTextIcon,
    },
    {
      feature: "flashcards" as const,
      title: "Flashcards",
      description: "Review existing flashcard-style lesson cards without adding a new study model yet.",
      href: "/mobile-flashcards",
      cta: "Open flashcards",
      icon: Layers3Icon,
    },
  ].filter((item) => isFeatureAllowedOnMobile(item.feature));

  return (
    <MobileAppShell>
      <section className="mb-6 flex flex-col items-start gap-4">
        <Badge variant="secondary" className="uppercase">
          Mobile study
        </Badge>
        <h1 className="text-3xl leading-[1.08] font-medium tracking-tight">Free mobile study tools</h1>
        <p className="text-muted-foreground text-base leading-7">
          A focused IntellectX mobile experience for quizzes and flashcards.
        </p>
      </section>

      <section className="grid gap-3">
        {studyItems.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.feature}
              className="animate-widget flex min-h-56 flex-col rounded-lg border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60"
            >
              <span className="bg-primary text-primary-foreground grid size-11 place-items-center rounded-full">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-5 text-xl font-semibold tracking-tight">{item.title}</h2>
              <p className="text-muted-foreground mt-3 flex-1 text-sm leading-6">{item.description}</p>
              <Button className="mt-6 min-h-12 w-full" asChild>
                <Link href={item.href}>{item.cta}</Link>
              </Button>
            </article>
          );
        })}
      </section>

      <p className="text-muted-foreground mt-8 text-center text-sm">
        Mobile scope: {featureScope.mobileStudyFeatures.join(", ")}.
      </p>
    </MobileAppShell>
  );
}
