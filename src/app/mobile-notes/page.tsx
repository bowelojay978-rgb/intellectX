import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { lessons } from "@/data/lessons";
import { ArrowRightIcon, FileTextIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mobile Notes - IntellectX",
  description: "A mobile IntellectX hub for lesson notes.",
};

export default function MobileNotesPage() {
  return (
    <PageShell>
      <section className="mb-10 flex flex-col items-center gap-5 text-center">
        <Badge variant="secondary" className="uppercase">
          Lesson notes
        </Badge>
        <h1 className="max-w-3xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
          Notes from lessons
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-6 md:text-lg">
          A focused mobile hub for opening the note-taking area inside each lesson. Notes stay attached to lessons while
          the standalone mobile notes experience grows.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {lessons.map((lesson) => (
          <article
            key={lesson.id}
            className="animate-widget flex min-h-56 flex-col rounded-lg border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60"
          >
            <span className="bg-primary text-primary-foreground grid size-11 place-items-center rounded-full">
              <FileTextIcon className="size-5" />
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight">{lesson.title}</h2>
            <p className="text-muted-foreground mt-3 flex-1 text-sm leading-6">{lesson.summary}</p>
            <Button className="mt-6 self-start" asChild>
              <Link href={`/learn/${lesson.id}#lesson-notes`}>
                Open lesson notes
                <ArrowRightIcon />
              </Link>
            </Button>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
