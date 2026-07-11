"use client";

import { StudyProfileCard } from "@/components/education/study-profile-card";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export function LearnerOnboarding() {
  const router = useRouter();

  function continueToCourseSelection() {
    router.replace("/courses");
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-lg border-dashed">
        <CardContent className="py-5 text-sm leading-6 text-muted-foreground">
          Complete your Study Profile first. Next, IntellectX will take you to the existing course-selection flow,
          where the 5-course limit, 7-day grace period, and selection lock remain authoritative.
        </CardContent>
      </Card>
      <StudyProfileCard
        showReset={false}
        submitLabel="Continue to course selection"
        onSaved={continueToCourseSelection}
      />
    </div>
  );
}
