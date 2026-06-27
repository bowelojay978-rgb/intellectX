import { PageShell } from "@/components/education/page-shell";
import { ProgressBar } from "@/components/education/progress-bar";
import { glassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courses, getCourse } from "@/data/courses";
import { getLessonsByCourse } from "@/data/lessons";
import { getQuizzesByCourse } from "@/data/quizzes";
import { ArrowRightIcon, BookOpenIcon, ClockIcon, FileQuestionIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type CourseDetailPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return courses.map((course) => ({ id: course.id }));
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const course = getCourse(id);

  return {
    title: course ? `${course.title} - IntellectX` : "Course - IntellectX",
    description: course?.description,
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = await params;
  const course = getCourse(id);

  if (!course) {
    notFound();
  }

  const lessons = getLessonsByCourse(course.id);
  const quizzes = getQuizzesByCourse(course.id);
  const firstLesson = lessons[0];

  return (
    <PageShell>
      <section
        className={`mb-8 rounded-lg border border-white/70 bg-gradient-to-br p-8 shadow-3xl dark:border-white/10 dark:via-card/50 ${course.accent}`}
      >
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            {course.level}
          </Badge>
          <h1 className="text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">{course.title}</h1>
          <p className="mt-5 max-w-2xl leading-7">{course.description}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <span className="inline-flex items-center gap-2">
              <ClockIcon className="size-4" />
              {course.duration}
            </span>
            <span>{course.subject}</span>
            <span className="inline-flex items-center gap-2">
              <BookOpenIcon className="size-4" />
              {lessons.length} lessons
            </span>
            <span className="inline-flex items-center gap-2">
              <FileQuestionIcon className="size-4" />
              {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
            </span>
          </div>
          <div className="mt-6 max-w-md space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Course progress</span>
              <span>{course.progress}%</span>
            </div>
            <ProgressBar value={course.progress} />
          </div>
          {firstLesson ? (
            <Button className="mt-8" size="lg" asChild>
              <Link href={`/learn/${firstLesson.id}`}>
                Continue learning
                <ArrowRightIcon />
              </Link>
            </Button>
          ) : (
            <Button className="mt-8" size="lg" disabled>
              Lessons coming soon
            </Button>
          )}
        </div>
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader>
            <CardTitle>Lessons</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {lessons.length > 0 ? (
              lessons.map((lesson, index) => (
                <Link
                  key={lesson.id}
                  href={`/learn/${lesson.id}`}
                  className="bg-secondary/40 hover:bg-secondary flex flex-col gap-3 rounded-lg p-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {index + 1}. {lesson.title}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">{lesson.summary}</p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-sm sm:pl-4">{lesson.duration}</span>
                </Link>
              ))
            ) : (
              <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
                Lessons are being prepared for this course.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader>
            <CardTitle>Knowledge checks</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quizzes.length > 0 ? (
              quizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/quiz/${quiz.id}`}
                  className="bg-secondary/40 hover:bg-secondary rounded-lg p-4 transition-colors"
                >
                  <p className="font-medium">{quiz.title}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{quiz.estimatedTime}</p>
                </Link>
              ))
            ) : (
              <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
                Quizzes will appear here after the lessons are ready.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
