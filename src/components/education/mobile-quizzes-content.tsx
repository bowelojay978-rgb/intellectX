"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { convexEnv } from "@/lib/education-data";
import { useLearnerCatalog } from "@/lib/learner-catalog-client";
import { ArrowRightIcon, BookOpenCheckIcon } from "lucide-react";
import Link from "next/link";

export function MobileQuizzesContent() {
  const catalog = useLearnerCatalog();

  if (convexEnv.isConfigured && !catalog.isLive) {
    return (
      <div className="rounded-lg border border-white/70 bg-white/60 p-6 text-center text-sm text-muted-foreground shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60">
        Loading current quizzes…
      </div>
    );
  }

  if (catalog.quizzes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No quizzes are available yet.
      </div>
    );
  }

  return (
    <section className="grid gap-3">
      {catalog.quizzes.map((quiz) => {
        const course = catalog.courseById.get(quiz.courseId);

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
              <Link href={`/quiz/${quiz.id}?from=mobile`}>
                Start quiz
                <ArrowRightIcon />
              </Link>
            </Button>
          </article>
        );
      })}
    </section>
  );
}
