import { MobileAppShell } from "@/components/education/mobile-app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StickyNoteIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lesson Notes - IntellectX",
  description: "Instructor-provided lesson material is available inside each IntellectX lesson.",
};

export default function MobileNotesPage() {
  return (
    <MobileAppShell>
      <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <span className="bg-primary text-primary-foreground grid size-12 place-items-center rounded-full">
          <StickyNoteIcon className="size-5" />
        </span>
        <Badge variant="secondary" className="mt-5 uppercase">
          Notes on web
        </Badge>
        <h1 className="mt-4 text-3xl leading-[1.08] font-medium tracking-tight text-foreground">
          Lesson notes stay with the full lesson experience
        </h1>
        <p className="text-muted-foreground mt-4 max-w-sm text-base leading-7">
          The free mobile app focuses on quizzes and flashcards. Instructor-provided notes remain attached to full
          lessons in the web experience.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/mobile-flashcards">Open flashcards</Link>
        </Button>
      </section>
    </MobileAppShell>
  );
}
