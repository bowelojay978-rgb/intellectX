import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
        <Badge variant="secondary" className="uppercase">
          Lesson material
        </Badge>
        <span className="bg-primary text-primary-foreground grid size-12 place-items-center rounded-full">
          <BookOpenIcon className="size-5" />
        </span>
        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
          Notes are part of each lesson
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-6 md:text-lg">
          Instructor notes, explanations, examples, and video-attached learning material now live directly inside the
          lesson experience.
        </p>
        <Button asChild>
          <Link href="/courses">Browse lessons</Link>
        </Button>
      </section>
    </PageShell>
  );
}
