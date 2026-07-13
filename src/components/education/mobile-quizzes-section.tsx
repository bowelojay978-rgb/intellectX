"use client";

import { AppLoadingSpinner } from "@/components/ui/app-loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLearnerCatalog } from "@/lib/learner-catalog-client";
import { ArrowRightIcon, BookOpenCheckIcon } from "lucide-react";
import Link from "next/link";

export function MobileQuizzesSection() {
  const catalog = useLearnerCatalog();

  if (catalog.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <AppLoadingSpinner label="Loading mobile quizzes" showLabel />
      </div>
    );
  }

  if (catalog.quizzes.length === 0) {
    return (
      <section className="animate-widget rounded-lg border border-white/70 bg-white/60 p-6 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60">
        <span className="bg-primary text-primary-foreground mx-auto grid size-11 place-items-center rounded-full">
          <BookOpenCheckIcon className="size-5" />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight">No quizzes available yet</h2>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          New knowledge checks will appear here when they are ready for learners.
        </p>
      </section>
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
              <Badge variant="outline">
                {quiz.questions.length} {quiz.questions.length === 1 ? "question" : "questions"}
              </Badge>
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">{quiz.title}</h2>
            <p className="text-muted-foreground mt-3 flex-1 text-sm leading-6">
              {course ? `${course.subject} practice from ${course.title}.` : "Practice with an available knowledge check."}
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
