import { PageShell } from "@/components/education/page-shell";
import { QuizPlayer } from "@/components/education/quiz-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCourse } from "@/data/courses";
import { getQuiz, quizzes } from "@/data/quizzes";
import { getContentAccessLevel, getEntitlementAccessDecision } from "@/lib/entitlements";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type QuizPageProps = {
  params: Promise<{ quizId: string }>;
};

export function generateStaticParams() {
  return quizzes.map((quiz) => ({ quizId: quiz.id }));
}

export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
  const { quizId } = await params;
  const quiz = getQuiz(quizId);

  return {
    title: quiz ? `${quiz.title} - IntellectX` : "Quiz - IntellectX",
    description: "Practice with an IntellectX multiple-choice quiz.",
  };
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { quizId } = await params;
  const quiz = getQuiz(quizId);

  if (!quiz) {
    notFound();
  }

  const accessDecision = getEntitlementAccessDecision({ accessLevel: getContentAccessLevel(quiz) });

  if (!accessDecision.allowed) {
    notFound();
  }

  const course = getCourse(quiz.courseId);

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl">
        <Badge variant="secondary" className="mb-5">
          Quiz
        </Badge>
        <h1 className="mb-4 text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">{quiz.title}</h1>
        <p className="text-muted-foreground mb-8 leading-6">
          Select an answer, check your result, and use the feedback to close the learning loop. Scores are not saved in
          Convex until your environment is configured, so this release stores attempts locally in the browser.
        </p>
        <QuizPlayer quiz={quiz} />
        {course && (
          <Button className="mt-6" variant="ghost" asChild>
            <Link href={`/courses/${course.id}`}>Back to course</Link>
          </Button>
        )}
      </section>
    </PageShell>
  );
}

