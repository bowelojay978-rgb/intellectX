"use client";

import { elevatedGlassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type AcademicProfile,
  clearAcademicProfile,
  educationLevels,
  getAcademicProfileOptions,
  getDefaultAcademicProfile,
  isAcademicProfileComplete,
  loadAcademicProfile,
  normalizeAcademicProfileForLevel,
  saveAcademicProfile,
} from "@/lib/academic-profile";
import { cn } from "@/lib/utils";
import { GraduationCapIcon, PencilIcon } from "lucide-react";
import { useEffect, useState } from "react";

type StudyProfileCardProps = {
  onSaved?: (profile: AcademicProfile) => void;
  submitLabel?: string;
  showReset?: boolean;
  loadSavedProfile?: boolean;
};

function academicProfilesMatch(left: AcademicProfile, right: AcademicProfile) {
  const normalizedLeft = normalizeAcademicProfileForLevel(left);
  const normalizedRight = normalizeAcademicProfileForLevel(right);

  return (
    normalizedLeft.educationLevel === normalizedRight.educationLevel &&
    normalizedLeft.curriculumOrInstitution === normalizedRight.curriculumOrInstitution &&
    normalizedLeft.gradeOrYear === normalizedRight.gradeOrYear &&
    normalizedLeft.subjectsOrModules.length === normalizedRight.subjectsOrModules.length &&
    normalizedLeft.subjectsOrModules.every((subject, index) => subject === normalizedRight.subjectsOrModules[index])
  );
}

export function StudyProfileCard({
  onSaved,
  submitLabel = "Save study profile",
  showReset = true,
  loadSavedProfile = true,
}: StudyProfileCardProps) {
  const [profile, setProfile] = useState<AcademicProfile>(getDefaultAcademicProfile);
  const [savedProfile, setSavedProfile] = useState<AcademicProfile | null>(null);
  const [isEditing, setIsEditing] = useState(!loadSavedProfile);
  const [profileReady, setProfileReady] = useState(!loadSavedProfile);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const normalizedProfile = normalizeAcademicProfileForLevel(profile);
  const profileOptions = getAcademicProfileOptions(normalizedProfile);
  const profileComplete = isAcademicProfileComplete(normalizedProfile);
  const hasUnsavedChanges = !savedProfile || !academicProfilesMatch(normalizedProfile, savedProfile);
  const canSave = profileComplete && hasUnsavedChanges;

  useEffect(() => {
    if (!loadSavedProfile) return;

    const storedProfile = loadAcademicProfile();

    if (storedProfile && isAcademicProfileComplete(storedProfile)) {
      const normalizedStoredProfile = normalizeAcademicProfileForLevel(storedProfile);
      setProfile(normalizedStoredProfile);
      setSavedProfile(normalizedStoredProfile);
      setIsEditing(false);
    } else {
      setSavedProfile(null);
      setIsEditing(true);
    }

    setProfileReady(true);
  }, [loadSavedProfile]);

  function updateProfile(updater: (currentProfile: AcademicProfile) => AcademicProfile) {
    if (!isEditing) return;
    setAttemptedSave(false);
    setProfile(updater);
  }

  function toggleSubject(subject: string) {
    updateProfile((currentProfile) => {
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

    if (!profileComplete) return;
    if (!hasUnsavedChanges && savedProfile) {
      if (loadSavedProfile) setIsEditing(false);
      return;
    }

    saveAcademicProfile(normalizedProfile);
    setSavedProfile(normalizedProfile);
    setAttemptedSave(false);

    if (loadSavedProfile) {
      setIsEditing(false);
    }

    onSaved?.(normalizedProfile);
  }

  function startEditing() {
    setAttemptedSave(false);
    setIsEditing(true);
  }

  function resetProfile() {
    clearAcademicProfile();
    setProfile(getDefaultAcademicProfile());
    setSavedProfile(null);
    setIsEditing(true);
    setAttemptedSave(false);
  }

  if (!profileReady) {
    return (
      <Card id="study-profile" className={`rounded-lg ${elevatedGlassCardClassName}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCapIcon className="size-5" />
            Study profile
          </CardTitle>
        </CardHeader>
        <CardContent role="status" aria-live="polite" className="text-muted-foreground text-sm">
          Loading study profile…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="study-profile" className={`rounded-lg ${elevatedGlassCardClassName}`}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <GraduationCapIcon className="size-5" />
            Study profile
          </CardTitle>
          {savedProfile && !isEditing ? (
            <Badge variant="secondary" role="status">
              Saved on this device
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-muted-foreground text-sm leading-6">
          Choose your academic track so IntellectX can prioritize relevant courses, quizzes, and study tools.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <ProfileSelect
            label="Academic level"
            value={normalizedProfile.educationLevel}
            options={educationLevels}
            disabled={!isEditing}
            onChange={(educationLevel) =>
              updateProfile((currentProfile) =>
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
            disabled={!isEditing}
            onChange={(curriculumOrInstitution) =>
              updateProfile((currentProfile) =>
                normalizeAcademicProfileForLevel({ ...currentProfile, curriculumOrInstitution }),
              )
            }
          />
          <ProfileSelect
            label={profileOptions.gradeLabel}
            value={normalizedProfile.gradeOrYear}
            options={profileOptions.gradeOptions}
            disabled={!isEditing}
            onChange={(gradeOrYear) =>
              updateProfile((currentProfile) => normalizeAcademicProfileForLevel({ ...currentProfile, gradeOrYear }))
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
                  disabled={!isEditing}
                  onClick={() => toggleSubject(subject)}
                  className={cn(
                    "min-h-11 touch-manipulation rounded-full border px-3 py-2 text-sm transition-all",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background/70 text-muted-foreground hover:text-foreground",
                    !isEditing && "cursor-default opacity-75",
                  )}
                >
                  {subject}
                </button>
              );
            })}
          </div>
          {attemptedSave && !profileComplete ? (
            <p className="text-destructive mt-3 text-sm" role="alert">
              Complete the required profile fields and choose at least one {profileOptions.subjectLabel.toLowerCase()}.
            </p>
          ) : null}
          {isEditing && savedProfile && hasUnsavedChanges ? (
            <p className="text-muted-foreground mt-3 text-sm" role="status">
              Unsaved changes
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {isEditing ? (
            <Button type="button" className="min-h-12" disabled={!canSave} onClick={saveProfile}>
              {submitLabel}
            </Button>
          ) : (
            <Button type="button" className="min-h-12" variant="outline" onClick={startEditing}>
              <PencilIcon className="size-4" />
              Edit profile
            </Button>
          )}
          {showReset && isEditing ? (
            <Button type="button" className="min-h-12" variant="outline" onClick={resetProfile}>
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
  disabled?: boolean;
  onChange: (value: string) => void;
};

function ProfileSelect({ label, value, options, disabled = false, onChange }: ProfileSelectProps) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="border-input bg-background/80 h-12 rounded-lg border px-3 text-sm outline-none transition-all focus:border-primary/50 focus:ring-ring/40 focus:ring-[3px] disabled:cursor-default disabled:opacity-75"
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
