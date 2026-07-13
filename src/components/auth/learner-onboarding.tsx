"use client";

import { StudyProfileCard } from "@/components/education/study-profile-card";
import { Card, CardContent } from "@/components/ui/card";
import { getLearnerHomeRouteForCurrentRuntime, isMobileAppRuntime } from "@/lib/feature-scope";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LearnerOnboarding() {
  const router = useRouter();
  const [nativeMobile, setNativeMobile] = useState(false);

  useEffect(() => {
    setNativeMobile(isMobileAppRuntime());
  }, []);

  function continueAfterProfile() {
    router.replace(getLearnerHomeRouteForCurrentRuntime());
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-lg border-dashed">
        <CardContent className="text-muted-foreground py-5 text-sm leading-6">
          {nativeMobile
            ? "Complete your Study Profile first. Then continue directly to the free mobile quiz and flashcard experience."
            : "Complete your Study Profile first. Next, continue to course selection, where the 5-course limit, 7-day grace period, and selection lock remain authoritative."}
        </CardContent>
      </Card>
      <StudyProfileCard
        showReset={false}
        submitLabel={nativeMobile ? "Continue to mobile quizzes" : "Continue to course selection"}
        onSaved={continueAfterProfile}
      />
    </div>
  );
}
