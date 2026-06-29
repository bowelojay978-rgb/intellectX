import { elevatedGlassCardClassName } from "@/components/education/glass-card";
import { LessonBlockRenderer } from "@/components/education/lesson-block-renderer";
import { LessonProgressSync } from "@/components/education/lesson-progress-sync";
import { PageShell } from "@/components/education/page-shell";
import { SubjectMark } from "@/components/education/subject-mark";
import { VideoPlayer } from "@/components/education/video-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCourse } from "@/data/courses";
import { getLesson, lessons } from "@/data/lessons";
import { ArrowRightIcon, ClockIcon, FileQuestionIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type LessonPageProps = {
  params: Promise<{ lessonId: string }>;
};

export function generateStaticParams() {
  return lessons.map((lesson) => ({ lessonId: lesson.id }));
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);

  return {
    title: lesson ? `${lesson.title} - IntellectX` : "Lesson - IntellectX",
    description: lesson?.summary,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);

  if (!lesson) {
    notFound();
  }

  const course = getCourse(lesson.courseId);

  return (
    <PageShell>
      <LessonProgressSync lessonId={lesson.id} />
      <article>
        <section className="mb-8 max-w-4xl">
          <Badge variant="secondary" className="mb-5 gap-2">
            {course && (
              <SubjectMark
                subject={course.subject}
                className="border-foreground/5 bg-background/60 -ml-1 size-5 text-[10px]"
              />
            )}
            {course?.title}
          </Badge>
          <h1 className="text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">{lesson.title}</h1>
          <p className="text-muted-foreground mt-4 leading-6">{lesson.summary}</p>
          <p className="text-muted-foreground mt-4 inline-flex items-center gap-2 text-sm">
            <ClockIcon className="size-4" />
            {lesson.duration}
          </p>
        </section>
        <section className="space-y-6">
          <div className="space-y-6">
            <div className="hidden lg:block">
              <VideoPlayer title={lesson.title} videoUrl={lesson.videoUrl} posterUrl={lesson.posterUrl} />
            </div>
            <Card id="lesson-flashcards" className={`scroll-mt-28 rounded-lg ${elevatedGlassCardClassName}`}>
              <CardContent className="space-y-6 py-8 text-base leading-8 md:text-lg">
                {lesson.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {lesson.blocks && <LessonBlockRenderer blocks={lesson.blocks} />}
              </CardContent>
            </Card>
          </div>
        </section>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {lesson.nextLessonId && (
            <Button size="lg" asChild>
              <Link href={`/learn/${lesson.nextLessonId}`}>
                Next lesson
                <ArrowRightIcon />
              </Link>
            </Button>
          )}
          {lesson.quizId && (
            <Button variant="outline" size="lg" asChild>
              <Link href={`/quiz/${lesson.quizId}`}>
                Related quiz
                <FileQuestionIcon />
              </Link>
            </Button>
          )}
          {course && (
            <Button variant="ghost" size="lg" asChild>
              <Link href={`/courses/${course.id}`}>Back to course</Link>
            </Button>
          )}
        </div>
      </article>
    </PageShell>
  );
}
