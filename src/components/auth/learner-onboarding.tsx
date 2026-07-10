"use client";

import { StudyProfileCard } from "@/components/education/study-profile-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AcademicProfile } from "@/lib/academic-profile";
import {
  courseMatchesAcademicProfile,
  isAcademicProfileComplete,
  loadAcademicProfile,
} from "@/lib/academic-profile";
import {
  COURSE_SELECTION_LIMIT,
  loadCourseSelection,
  saveCourseSelection,
} from "@/lib/course-selection";
import { useLearnerCatalog } from "@/lib/learner-catalog-client";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, GraduationCapIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type LearnerOnboardingProps = {
  onComplete?: () => void;
  completeLabel?: string;
  loadSavedProfile?: boolean;
};

type OnboardingStep = "profile" | "courses";

export function LearnerOnboarding({
  onComplete,
  completeLabel = "Enter IntellectX",
  loadSavedProfile = true,
}: LearnerOnboardingProps) {
  const router = useRouter();
  const catalog = useLearnerCatalog();
  const [step, setStep] = useState<OnboardingStep>("profile");
  const [profile, setProfile] = useState<AcademicProfile | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!loadSavedProfile) return;

    const savedProfile = loadAcademicProfile();
    if (savedProfile && isAcademicProfileComplete(savedProfile)) {
      setProfile(savedProfile);
      setSelectedCourseIds(loadCourseSelection().selectedCourseIds);
      setStep("courses");
    }
  }, [loadSavedProfile]);

  const matchedCourses = useMemo(() => {
    if (!profile) return [];
    return catalog.courses.filter((course) => courseMatchesAcademicProfile(course, profile));
  }, [catalog.courses, profile]);

  const availableCourses = matchedCourses.length > 0 ? matchedCourses : catalog.courses;

  function handleProfileSaved(nextProfile: AcademicProfile) {
    setProfile(nextProfile);
    setSelectedCourseIds((current) =>
      current.filter((courseId) => {
        const course = catalog.courseById.get(courseId);
        return course ? courseMatchesAcademicProfile(course, nextProfile) : false;
      }),
    );
    setSelectionError(null);
    setStep("courses");
  }

  function toggleCourse(courseId: string) {
    setSelectionError(null);
    setSelectedCourseIds((current) => {
      if (current.includes(courseId)) {
        return current.filter((id) => id !== courseId);
      }

      if (current.length >= COURSE_SELECTION_LIMIT) {
        setSelectionError(`You can select up to ${COURSE_SELECTION_LIMIT} courses.`);
        return current;
      }

      return [...current, courseId];
    });
  }

  function completeOnboarding() {
    if (selectedCourseIds.length === 0) {
      setSelectionError("Choose at least one course before continuing.");
      return;
    }

    saveCourseSelection({
      selectedCourseIds,
      selectedAt: null,
      gracePeriodEndsAt: null,
      lockedAt: null,
      locked: false,
    });

    if (onComplete) {
      onComplete();
      return;
    }

    router.replace("/courses");
  }

  if (step === "profile") {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">Step 1 of 2 · Study profile</p>
        <StudyProfileCard
          loadSavedProfile={loadSavedProfile}
          showReset={false}
          submitLabel="Continue to course selection"
          onSaved={handleProfileSaved}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Step 2 of 2 · Choose courses</p>
      <Card>
        <CardHeader>
          <div className="bg-primary/10 text-primary grid size-11 place-items-center rounded-full">
            <GraduationCapIcon className="size-5" />
          </div>
          <CardTitle className="text-2xl tracking-tight">Choose your courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-muted-foreground text-sm leading-6">
            Choose between 1 and {COURSE_SELECTION_LIMIT} courses. You can adjust them during the grace period after signup.
          </p>

          {availableCourses.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {availableCourses.map((course) => {
                const selected = selectedCourseIds.includes(course.id);

                return (
                  <button
                    key={course.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleCourse(course.id)}
                    className={cn(
                      "flex min-h-24 items-start justify-between gap-3 rounded-lg border p-4 text-left transition",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background/70 hover:border-primary/40 hover:bg-secondary/40",
                    )}
                  >
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-muted-foreground mt-1 text-sm">{course.subject}</p>
                    </div>
                    {selected ? <CheckIcon className="text-primary size-5 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
              No courses are available for selection yet.
            </p>
          )}

          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{selectedCourseIds.length} selected</span>
            <span className="font-medium">Maximum {COURSE_SELECTION_LIMIT}</span>
          </div>

          {selectionError ? <p className="text-destructive text-sm">{selectionError}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setStep("profile")}>
              <ArrowLeftIcon className="size-4" />
              Back to study profile
            </Button>
            <Button type="button" disabled={selectedCourseIds.length === 0} onClick={completeOnboarding}>
              {completeLabel}
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
