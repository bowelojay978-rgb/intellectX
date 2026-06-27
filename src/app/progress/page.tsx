import { glassCardClassName } from "@/components/education/glass-card";
import { DataSourceBadge } from "@/components/education/data-source-badge";
import { PageShell } from "@/components/education/page-shell";
import { ProgressCharts } from "@/components/education/progress-charts";
import { ProgressBar } from "@/components/education/progress-bar";
import { StreakCard } from "@/components/education/streak-card";
import { SubjectMark } from "@/components/education/subject-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { educationData } from "@/lib/education-data";
import { ArrowRightIcon, BookOpenCheckIcon, BrainIcon, TrophyIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Progress - IntellectX",
  description: "Track IntellectX learning progress, streaks, quizzes, and next focus areas.",
};

export default function ProgressPage() {
  const summary = educationData.getProgressSummary();

  return (
    <PageShell>
      <section className="mb-8 flex flex-col gap-4">
        <Badge variant="secondary" className="w-fit uppercase">
          Progress
        </Badge>
        <DataSourceBadge />
        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">Your learning momentum</h1>
        <p className="text-muted-foreground max-w-2xl leading-6">
          See completion, quiz performance, weekly rhythm, and the next best focus for your study sessions.
        </p>
      </section>
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent className="space-y-3">
            <BookOpenCheckIcon className="size-5" />
            <p className="text-3xl font-semibold tracking-tight">{summary.overallCompletion}%</p>
            <p className="text-muted-foreground text-sm">Overall completion</p>
            <ProgressBar value={summary.overallCompletion} />
          </CardContent>
        </Card>
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardContent>
            <TrophyIcon className="mb-3 size-5" />
            <p className="text-3xl font-semibold tracking-tight">{summary.user.averageQuizScore}%</p>
            <p className="text-muted-foreground text-sm">Average quiz performance</p>
          </CardContent>
        </Card>
        <StreakCard compact />
      </section>
      <ProgressCharts courses={summary.courses} completion={summary.overallCompletion} />
      <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader>
            <CardTitle>Course progress</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            {summary.courses.map((course) => (
              <div key={course.id} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <SubjectMark subject={course.subject} />
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-muted-foreground text-sm">{course.subject}</p>
                    </div>
                  </div>
                  <span className="font-semibold">{course.progress}%</span>
                </div>
                <ProgressBar value={course.progress} />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="grid gap-5">
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainIcon className="size-5" />
                Next recommended focus
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4 text-sm leading-6">
              <p>{summary.nextFocus}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/dashboard">
                    Dashboard
                    <ArrowRightIcon />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/courses">Courses</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle>Weak areas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {summary.weakAreas.map((area) => (
                <div key={area} className="bg-secondary/40 flex items-center gap-3 rounded-lg p-4 text-sm">
                  <SubjectMark subject={area} className="size-5 text-[10px]" />
                  {area}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
