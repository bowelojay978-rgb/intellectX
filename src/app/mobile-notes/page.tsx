import { PageShell } from "@/components/education/page-shell";
import { BookOpenIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lesson Notes - IntellectX",
  description: "Instructor-provided lesson material is available inside each IntellectX lesson.",
};

export default function MobileNotesPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl space-y-6">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em]">
          Lesson material
        </p>
        <div className="inline-flex size-12 items-center justify-center rounded-full border border-foreground/10 bg-muted text-muted-foreground">
          <BookOpenIcon className="size-5" />
        </div>
        <div className="space-y-4">
          <h1 className="max-w-2xl text-4xl leading-[1.1] font-medium tracking-tight text-foreground md:text-6xl">
            Notes are part of each lesson
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Instructor notes, explanations, examples, and video-attached learning material now live directly inside the
            lesson experience.
          </p>
        </div>
        <Link
          href="/courses"
          className="inline-flex rounded-full border border-foreground/15 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Browse lessons
        </Link>
      </section>
    </PageShell>
  );
}

