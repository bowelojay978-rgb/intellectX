import { MobileAppShell } from "@/components/education/mobile-app-shell";
import { MobileQuizzesContent } from "@/components/education/mobile-quizzes-content";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobile Quizzes - IntellectX",
  description: "Practice IntellectX knowledge checks from a focused mobile quiz hub.",
};

export default function MobileQuizzesPage() {
  return (
    <MobileAppShell>
      <section className="mb-6 flex flex-col items-start gap-4">
        <Badge variant="secondary" className="uppercase">
          Mobile quizzes
        </Badge>
        <h1 className="text-3xl leading-[1.08] font-medium tracking-tight">Practice with focused quizzes</h1>
        <p className="text-muted-foreground text-base leading-7">
          Pick a knowledge check and continue straight into the current quiz player.
        </p>
      </section>

      <MobileQuizzesContent />
    </MobileAppShell>
  );
}
