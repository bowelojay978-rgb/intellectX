"use client";

import { elevatedGlassCardClassName } from "@/components/education/glass-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type AcademicProfile,
  clearAcademicProfile,
  educationLevels,
  getAcademicProfileOptions,
  getDefaultAcademicProfile,
  isAcademicProfileComplete,
  normalizeAcademicProfileForLevel,
  loadAcademicProfile,
  saveAcademicProfile,
} from "@/lib/academic-profile";
import { cn } from "@/lib/utils";
import { GraduationCapIcon } from "lucide-react";
import { useEffect, useState } from "react";

type StudyProfileCardProps = {
  onSaved?: (profile: AcademicProfile) => void;
  submitLabel?: string;
  showReset?: boolean;
  loadSavedProfile?: boolean;
};

export function StudyProfileCard({
  onSaved,
  submitLabel = "Save study profile",
  showReset = true,
  loadSavedProfile = true,
}: StudyProfileCardProps) {
  const [profile, setProfile] = useState<AcademicProfile>(getDefaultAcademicProfile);
  const [saved, setSaved] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const normalizedProfile = normalizeAcademicProfileForLevel(profile);
  const profileOptions = getAcademicProfileOptions(normalizedProfile);
  const canSave = isAcademicProfileComplete(normalizedProfile);

  useEffect(() => {
    if (!loadSavedProfile) return;

    const storedProfile = loadAcademicProfile();
    if (storedProfile) setProfile(normalizeAcademicProfileForLevel(storedProfile));
  }, [loadSavedProfile]);

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
    setAttemptedSave(true);

    if (!canSave) return;

    saveAcademicProfile(normalizedProfile);
    setSaved(true);
    onSaved?.(normalizedProfile);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function resetProfile() {
    clearAcademicProfile();
    setProfile(getDefaultAcademicProfile());
    setSaved(false);
    setAttemptedSave(false);
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
            value={normalizedProfile.educationLevel}
            options={educationLevels}
            onChange={(educationLevel) =>
              setProfile((currentProfile) =>
                normalizeAcademicProfileForLevel({
                  ...currentProfile,
                  educationLevel: educationLevel as AcademicProfile["educationLevel"],
                  subjectsOrModules: [],
                }),
              )
            }
          />
          <ProfileSelect
            label={profileOptions.curriculumLabel}
            value={normalizedProfile.curriculumOrInstitution}
            options={profileOptions.curriculumOptions}
            onChange={(curriculumOrInstitution) =>
              setProfile((currentProfile) =>
                normalizeAcademicProfileForLevel({ ...currentProfile, curriculumOrInstitution }),
              )
            }
          />
          <ProfileSelect
            label={profileOptions.gradeLabel}
            value={normalizedProfile.gradeOrYear}
            options={profileOptions.gradeOptions}
            onChange={(gradeOrYear) =>
              setProfile((currentProfile) => normalizeAcademicProfileForLevel({ ...currentProfile, gradeOrYear }))
            }
          />
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">{profileOptions.subjectLabel}</p>
          <div className="flex flex-wrap gap-2">
            {profileOptions.subjectOptions.map((subject) => {
              const selected = normalizedProfile.subjectsOrModules.includes(subject);

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
          {attemptedSave && !canSave ? (
            <p className="text-destructive mt-3 text-sm">
              Complete the required profile fields and choose at least one {profileOptions.subjectLabel.toLowerCase()}.
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={saveProfile}>
            {saved ? "Saved" : submitLabel}
          </Button>
          {showReset ? (
            <Button type="button" variant="outline" onClick={resetProfile}>
              Clear profile
            </Button>
          ) : null}
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
