"use client";

import { PageShell } from "@/components/education/page-shell";
import { SecureQuizPlayer } from "@/components/education/secure-quiz-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Quiz } from "@/data/quizzes";
import { isMobileAppRuntime } from "@/lib/feature-scope";
import Link from "next/link";
import { useEffect, useState } from "react";

type QuizPageContentProps = {
  quiz: Quiz;
  courseId: string;
  mobileRequested: boolean;
};

export function QuizPageContent({ quiz, courseId, mobileRequested }: QuizPageContentProps) {
  const [nativeMobile, setNativeMobile] = useState(false);

  useEffect(() => {
    setNativeMobile(isMobileAppRuntime());
  }, []);

  const mobileSurface = mobileRequested || nativeMobile;

  return (
    <PageShell surface={mobileSurface ? "mobile" : "web"}>
      <section className={mobileSurface ? "w-full" : "mx-auto max-w-3xl"}>
        <Badge variant="secondary" className="mb-5">
          Quiz
        </Badge>
        <h1
          className={
            mobileSurface
              ? "mb-4 text-3xl leading-[1.1] font-medium tracking-tight"
              : "mb-4 text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl"
          }
        >
          {quiz.title}
        </h1>
        <p className="text-muted-foreground mb-8 leading-6">
          Select an answer, check your result, and use the feedback to close the learning loop. Completed attempts are
          saved so your scores and learning activity can appear across IntellectX.
        </p>
        <SecureQuizPlayer quiz={quiz} surface={mobileSurface ? "mobile" : "web"} />
        <Button className="mt-6 min-h-12" variant="ghost" asChild>
          <Link href={mobileSurface ? "/mobile-quizzes" : `/courses/${courseId}`}>
            {mobileSurface ? "Back to mobile quizzes" : "Back to course"}
          </Link>
        </Button>
      </section>
    </PageShell>
  );
}
