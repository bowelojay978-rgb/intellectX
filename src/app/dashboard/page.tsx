import { LearnerSessionName } from "@/components/auth/learner-session-name";
import { LocalQuizPerformance } from "@/components/education/local-quiz-performance";
import { CourseCard } from "@/components/education/course-card";
import { DataSourceBadge } from "@/components/education/data-source-badge";
import { EmptyState } from "@/components/education/empty-state";
import { clickableGlassCardClassName, glassCardClassName } from "@/components/education/glass-card";
import { PageShell } from "@/components/education/page-shell";
import { StatCard } from "@/components/education/stat-card";
import { StreakCard } from "@/components/education/streak-card";
import { SubjectMark } from "@/components/education/subject-mark";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courses } from "@/data/courses";
import { lessons } from "@/data/lessons";
import { userProgress } from "@/data/user-progress";
import {
  BookOpenCheckIcon,
  BookOpenIcon,
  FlameIcon,
  GraduationCapIcon,
  Layers3Icon,
  TargetIcon,
  TrophyIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard - IntellectX",
  description: "View IntellectX courses, recent lessons, quiz progress, and study focus.",
};

export default function DashboardPage() {
  const enrolledCourses = courses.filter((course) => userProgress.enrolledCourseIds.includes(course.id));
  const recentLessons = lessons.filter((lesson) => userProgress.recentLessonIds.includes(lesson.id));

  return (
    <PageShell>
      <section className="mb-8 flex flex-col gap-4">
        <Badge variant="secondary" className="w-fit uppercase">
          Dashboard
        </Badge>
        <DataSourceBadge />
        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
          Welcome back, <LearnerSessionName firstNameOnly />
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-6">
          Your learning cockpit for enrolled courses, recent lessons, quiz performance, and study consistency.
          Learner identity is read from this browser session. Quiz performance uses local attempts until account-level persistence is completed.
        </p>
      </section>
      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Study streak" value="No activity yet" icon={FlameIcon} />
        <StatCard label="Total hours" value="No activity yet" icon={GraduationCapIcon} />
        <StatCard label="Lessons done" value="No activity yet" icon={BookOpenCheckIcon} />
        <StatCard label="Avg. quiz score" value="No attempts yet" icon={TrophyIcon} />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Enrolled courses</h2>
            <Link href="/courses" className="text-muted-foreground text-sm underline underline-offset-4">
              Browse all
            </Link>
          </div>
          {enrolledCourses.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {enrolledCourses.slice(0, 2).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No enrolled courses yet"
              description="Start with one course to turn this dashboard into a focused study plan."
              actionHref="/courses"
              actionLabel="Browse courses"
              icon={BookOpenIcon}
            />
          )}
        </div>
        <div className="grid gap-5">
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle>Study shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link
                href="/mobile-quizzes"
                aria-label="Open mobile quizzes"
                className={`bg-secondary/40 hover:bg-secondary flex items-center gap-3 rounded-lg p-4 ${clickableGlassCardClassName}`}
              >
                <BookOpenCheckIcon className="size-5" />
                <div>
                  <p className="font-medium">Quizzes</p>
                  <p className="text-muted-foreground mt-1 text-sm">Start your next knowledge check.</p>
                </div>
              </Link>
              <Link
                href="/mobile-flashcards"
                aria-label="Open mobile flashcards"
                className={`bg-secondary/40 hover:bg-secondary flex items-center gap-3 rounded-lg p-4 ${clickableGlassCardClassName}`}
              >
                <Layers3Icon className="size-5" />
                <div>
                  <p className="font-medium">Flashcards</p>
                  <p className="text-muted-foreground mt-1 text-sm">Review flashcard-style lesson cards.</p>
                </div>
              </Link>
            </CardContent>
          </Card>
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle>Recent lessons</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {recentLessons.length > 0 ? (
                recentLessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/learn/${lesson.id}`}
                    className={`bg-secondary/40 hover:bg-secondary flex items-center gap-3 rounded-lg p-4 ${clickableGlassCardClassName}`}
                  >
                    <SubjectMark
                      subject={courses.find((course) => course.id === lesson.courseId)?.subject ?? lesson.courseId}
                      className="size-5 text-[10px]"
                    />
                    <div>
                      <p className="font-medium">{lesson.title}</p>
                      <p className="text-muted-foreground mt-1 text-sm">{lesson.duration}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
                  Recent lessons will appear after study activity is available.
                </div>
              )}
            </CardContent>
          </Card>
          <StreakCard compact />
          <LocalQuizPerformance />
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TargetIcon className="size-5" />
                Today&apos;s focus
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-6">
              Review Memory Systems, complete one knowledge check, and protect a 25-minute study block.
            </CardContent>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}






