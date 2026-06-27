import { ConvexQuizzesSection } from "@/components/education/convex-quizzes-section";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import { educationData } from "@/lib/education-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quizzes - IntellectX",
  description: "Practice with IntellectX knowledge checks.",
};

export default function QuizzesPage() {
  const quizzes = educationData.listQuizzes();

  return (
    <PageShell>
      <section className="mb-10 flex flex-col items-center gap-5 text-center">
        <Badge variant="secondary" className="uppercase">
          Quizzes
        </Badge>
        <h1 className="max-w-3xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
          Practice where learning becomes visible
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-6 md:text-lg">
          Choose a knowledge check, review explanations after each answer, and finish with a clear score summary.
        </p>
      </section>
      <ConvexQuizzesSection fallbackQuizzes={quizzes} />
    </PageShell>
  );
}
