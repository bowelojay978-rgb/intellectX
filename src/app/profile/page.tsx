import { ProfileDemoSession } from "@/components/auth/profile-demo-session";
import { CourseCard } from "@/components/education/course-card";
import { DataSourceBadge } from "@/components/education/data-source-badge";
import { EmptyState } from "@/components/education/empty-state";
import { glassCardClassName, elevatedGlassCardClassName } from "@/components/education/glass-card";
import { PageShell } from "@/components/education/page-shell";
import { StatCard } from "@/components/education/stat-card";
import { StreakCard } from "@/components/education/streak-card";
import { StudyProfileCard } from "@/components/education/study-profile-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courses } from "@/data/courses";
import { userProgress } from "@/data/user-progress";
import {
  BookOpenCheckIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  FlameIcon,
  SettingsIcon,
  ShieldIcon,
  TrophyIcon,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile - IntellectX",
  description: "View a mock learner profile in IntellectX.",
};

export default function ProfilePage() {
  const enrolledCourses = courses.filter((course) => userProgress.enrolledCourseIds.includes(course.id));

  return (
    <PageShell>
      <section className={`animate-widget mb-8 flex flex-col gap-6 rounded-lg p-6 md:flex-row md:items-center md:p-8 ${elevatedGlassCardClassName}`}>
        <Avatar className="size-20">
          <AvatarImage src={userProgress.avatar} alt={userProgress.name} />
          <AvatarFallback>MC</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Badge variant="secondary" className="mb-3">
            Profile
          </Badge>
          <DataSourceBadge />
          <h1 className="text-4xl font-medium tracking-tight">{userProgress.name}</h1>
          <p className="text-muted-foreground mt-1">{userProgress.role}</p>
        </div>
        <div className="grid gap-1 text-sm md:text-right">
          <span className="text-muted-foreground">Learning goal</span>
          <span className="font-medium">5 focused sessions each week</span>
        </div>
      </section>
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Study streak" value={`${userProgress.studyStreak} days`} icon={FlameIcon} />
        <StatCard label="Completed lessons" value={`${userProgress.completedLessons}`} icon={BookOpenCheckIcon} />
        <StatCard label="Average score" value={`${userProgress.averageQuizScore}%`} icon={TrophyIcon} />
      </section>
      <section className="mb-8">
        <StudyProfileCard />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">Enrolled courses</h2>
          {enrolledCourses.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {enrolledCourses.slice(0, 2).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No courses on this profile"
              description="Enroll in a course to make this profile reflect active learning progress."
              actionHref="/courses"
              actionLabel="Browse courses"
              icon={BookOpenIcon}
            />
          )}
        </div>
        <div className="grid gap-5">
          <StreakCard />
          <ProfileDemoSession className={`rounded-lg ${glassCardClassName}`} />
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="size-5" />
                Account snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3 text-sm leading-6">
              <p>Plan: Scholar preview</p>
              <p>Preferred pace: 25-minute study blocks</p>
              <p>No authentication or account persistence has been added in this prototype.</p>
            </CardContent>
          </Card>
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheckIcon className="size-5" />
                Weekly rhythm
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-6">
              Monday, Wednesday, and Saturday are reserved for course progress. Friday is for quiz review.
            </CardContent>
          </Card>
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldIcon className="size-5" />
                Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-6">
              Future privacy controls can manage learning data, AI personalization, and export settings.
            </CardContent>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
