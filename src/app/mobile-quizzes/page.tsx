import { MobileAppShell } from "@/components/education/mobile-app-shell";
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

      <section className="grid gap-3">
        {quizzes.map((quiz) => {
          const course = courses.find((item) => item.id === quiz.courseId);

          return (
            <article
              key={quiz.id}
              className="animate-widget flex min-h-56 flex-col rounded-lg border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60"
            >
              <span className="bg-primary text-primary-foreground grid size-11 place-items-center rounded-full">
                <BookOpenCheckIcon className="size-5" />
              </span>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="secondary">{quiz.difficulty}</Badge>
                <Badge variant="outline">{quiz.estimatedTime}</Badge>
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-tight">{quiz.title}</h2>
              <p className="text-muted-foreground mt-3 flex-1 text-sm leading-6">
                {course ? `${course.subject} practice from ${course.title}.` : "Practice with an available quiz."}
              </p>
              <Button className="mt-6 min-h-12 w-full" asChild>
                <Link href={`/quiz/${quiz.id}`}>
                  Start quiz
                  <ArrowRightIcon />
                </Link>
              </Button>
            </article>
          );
        })}
      </section>
    </MobileAppShell>
  );
}
