import { ProgressBar } from "@/components/education/progress-bar";
import { clickableGlassCardClassName, elevatedGlassCardClassName } from "@/components/education/glass-card";
import { getSubjectMark } from "@/components/education/subject-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course } from "@/data/courses";
import { BookOpenIcon, ClockIcon, FileQuestionIcon } from "lucide-react";
import Link from "next/link";

type CourseCardProps = {
  course: Course;
  showProgress?: boolean;
};

export function CourseCard({ course, showProgress = true }: CourseCardProps) {
  const subjectMark = getSubjectMark(course.subject);

  return (
    <Card className={`animate-widget overflow-hidden rounded-lg ${elevatedGlassCardClassName} ${clickableGlassCardClassName}`}>
      <div className={`relative h-24 bg-gradient-to-br ${course.accent} dark:via-card/50`}>
        <div className="border-foreground/10 text-foreground/70 absolute right-5 bottom-4 grid size-12 place-items-center rounded-full border bg-white/45 text-2xl font-medium shadow-sm grayscale backdrop-blur dark:bg-black/20 dark:text-white/70">
          <span aria-hidden="true">{subjectMark}</span>
        </div>
      </div>
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">{course.level}</Badge>
          <span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
            <ClockIcon className="size-4" />
            {course.duration}
          </span>
          <span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
            <FileQuestionIcon className="size-4" />
            {course.quizIds.length} quiz
          </span>
        </div>
        <CardTitle className="text-xl tracking-tight">{course.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <p className="text-muted-foreground text-sm leading-6">{course.description}</p>
        {showProgress ? (
          <div className="mt-auto space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <BookOpenIcon className="size-4" />
                Progress
              </span>
              <span className="font-medium">{course.progress}%</span>
            </div>
            <ProgressBar value={course.progress} />
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href={`/courses/${course.id}`}>View course</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
