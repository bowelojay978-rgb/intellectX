"use client";

import { elevatedGlassCardClassName } from "@/components/education/glass-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type AcademicProfile,
  clearAcademicProfile,
  curriculumOptions,
  educationLevels,
  gradeOrYearOptions,
  loadAcademicProfile,
  saveAcademicProfile,
  subjectOptions,
} from "@/lib/academic-profile";
import { cn } from "@/lib/utils";
import { GraduationCapIcon } from "lucide-react";
import { useEffect, useState } from "react";

const defaultProfile: AcademicProfile = {
  educationLevel: "Senior Secondary",
  curriculumOrInstitution: "Botswana",
  gradeOrYear: "Form 5",
  subjectsOrModules: ["AI Productivity"],
};

export function StudyProfileCard() {
  const [profile, setProfile] = useState<AcademicProfile>(defaultProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedProfile = loadAcademicProfile();
    if (storedProfile) setProfile(storedProfile);
  }, []);

  function toggleSubject(subject: string) {
    setProfile((currentProfile) => {
      const subjects = currentProfile.subjectsOrModules.includes(subject)
        ? currentProfile.subjectsOrModules.filter((item) => item !== subject)
        : [...currentProfile.subjectsOrModules, subject];

      return {
        ...currentProfile,
        subjectsOrModules: subjects,
      };
    });
  }

  function saveProfile() {
    saveAcademicProfile({
      ...profile,
      subjectsOrModules: profile.subjectsOrModules.length > 0 ? profile.subjectsOrModules : defaultProfile.subjectsOrModules,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function resetProfile() {
    clearAcademicProfile();
    setProfile(defaultProfile);
    setSaved(false);
  }

  return (
    <Card id="study-profile" className={`rounded-lg ${elevatedGlassCardClassName}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCapIcon className="size-5" />
          Study profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-muted-foreground text-sm leading-6">
          Choose your academic track so IntellectX can prioritize relevant courses and quizzes in this browser.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <ProfileSelect
            label="Academic level"
            value={profile.educationLevel}
            options={educationLevels}
            onChange={(educationLevel) =>
              setProfile((currentProfile) => ({
                ...currentProfile,
                educationLevel: educationLevel as AcademicProfile["educationLevel"],
              }))
            }
          />
          <ProfileSelect
            label="Curriculum / institution"
            value={profile.curriculumOrInstitution}
            options={curriculumOptions}
            onChange={(curriculumOrInstitution) =>
              setProfile((currentProfile) => ({ ...currentProfile, curriculumOrInstitution }))
            }
          />
          <ProfileSelect
            label="Grade / year"
            value={profile.gradeOrYear}
            options={gradeOrYearOptions}
            onChange={(gradeOrYear) => setProfile((currentProfile) => ({ ...currentProfile, gradeOrYear }))}
          />
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Subjects / modules</p>
          <div className="flex flex-wrap gap-2">
            {subjectOptions.map((subject) => {
              const selected = profile.subjectsOrModules.includes(subject);

              return (
                <button
                  key={subject}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleSubject(subject)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm transition-all",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background/70 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {subject}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={saveProfile}>
            {saved ? "Saved" : "Save study profile"}
          </Button>
          <Button type="button" variant="outline" onClick={resetProfile}>
            Clear profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type ProfileSelectProps = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
};

function ProfileSelect({ label, value, options, onChange }: ProfileSelectProps) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-input bg-background/80 h-11 rounded-lg border px-3 text-sm outline-none transition-all focus:border-primary/50 focus:ring-ring/40 focus:ring-[3px]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
