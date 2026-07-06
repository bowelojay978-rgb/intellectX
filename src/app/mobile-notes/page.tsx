import { MobileAppShell } from "@/components/education/mobile-app-shell";
import { Badge } from "@/components/ui/badge";
import { lessons } from "@/data/lessons";
import { StickyNoteIcon } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lesson Notes - IntellectX",
  description: "Instructor-provided lesson material is available inside each IntellectX lesson.",
};

export default function MobileNotesPage() {
  return (
    <MobileAppShell>
      <section className="mb-6 flex flex-col items-start gap-4">
        <Badge variant="secondary" className="uppercase">
          Mobile notes
        </Badge>
        <h1 className="text-3xl leading-[1.08] font-medium tracking-tight text-foreground">Lesson notes for review</h1>
        <p className="text-muted-foreground text-base leading-7">
          Compact notes from the existing lesson material, without course browsing or paid prompts.
        </p>
      </section>

      <section className="grid gap-3">
        {lessons.map((lesson) => (
          <article
            key={lesson.id}
            className="animate-widget rounded-lg border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="bg-primary text-primary-foreground grid size-10 shrink-0 place-items-center rounded-full">
                <StickyNoteIcon className="size-4" />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{lesson.title}</h2>
                <p className="text-muted-foreground mt-1 text-xs">{lesson.duration}</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{lesson.summary}</p>
            <ul className="mt-4 space-y-2 text-sm leading-6">
              {lesson.content.slice(0, 2).map((note) => (
                <li key={note} className="rounded-lg bg-secondary/50 p-3">
                  {note}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </MobileAppShell>
  );
}
