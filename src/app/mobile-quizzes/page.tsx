import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { courses } from "@/data/courses";
import { quizzes } from "@/data/quizzes";
import { ArrowRightIcon, BookOpenCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mobile Quizzes - IntellectX",
  description: "Practice IntellectX knowledge checks from a focused mobile quiz hub.",
};

export default function MobileQuizzesPage() {
  return (
    <PageShell>
      <section className="mb-10 flex flex-col items-center gap-5 text-center">
        <Badge variant="secondary" className="uppercase">
          Mobile quizzes
        </Badge>
        <h1 className="max-w-3xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
          Practice with focused quizzes
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-6 md:text-lg">
          A mobile quiz hub backed by the existing IntellectX quiz system. Pick a knowledge check and continue straight
          into the current quiz player.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {quizzes.map((quiz) => {
          const course = courses.find((item) => item.id === quiz.courseId);

          return (
            <article
              key={quiz.id}
              className="animate-widget flex min-h-64 flex-col rounded-lg border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60"
            >
              <span className="bg-primary text-primary-foreground grid size-11 place-items-center rounded-full">
                <BookOpenCheckIcon className="size-5" />
              </span>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="secondary">{quiz.difficulty}</Badge>
                <Badge variant="outline">{quiz.estimatedTime}</Badge>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">{quiz.title}</h2>
              <p className="text-muted-foreground mt-3 flex-1 text-sm leading-6">
                {course ? `${course.subject} practice from ${course.title}.` : "Practice with an available quiz."}
              </p>
              <Button className="mt-6 self-start" asChild>
                <Link href={`/quiz/${quiz.id}`}>
                  Start quiz
                  <ArrowRightIcon />
                </Link>
              </Button>
            </article>
          );
        })}
      </section>
    </PageShell>
  );
}
