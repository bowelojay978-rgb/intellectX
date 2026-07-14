import type { Course } from "@/data/courses";
import type { Quiz } from "@/data/quizzes";

export const ACADEMIC_PROFILE_KEY = "intellectx:academic-profile";
export const ACADEMIC_PROFILE_CHANGE_EVENT = "intellectx-academic-profile-change";
export const ACADEMIC_PROFILE_SYNC_STATUS_EVENT = "intellectx-academic-profile-sync-status";
export const ACADEMIC_PROFILE_SYNC_RETRY_EVENT = "intellectx-academic-profile-sync-retry";
export const ACADEMIC_PROFILE_DRAFT_KEY_PREFIX = "intellectx:academic-profile-draft";

export type AcademicProfileSyncStatus = "idle" | "pending" | "success" | "error";

export type AcademicProfileSyncStatusDetail = {
  status: AcademicProfileSyncStatus;
};

export const educationLevels = [
  "Primary",
  "Junior",
  "Senior",
  "University / Varsity",
] as const;

export const schoolCurriculum = "Botswana curriculum" as const;

export const institutionOptions = ["UB", "BAC", "BIUST"] as const;

export const gradeOrYearOptions = [
  "Primary level",
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "A-Level",
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
] as const;

export const schoolSubjectOptions = [
  "Mathematics",
  "English",
  "Science",
  "Biology",
  "Chemistry",
  "Physics",
  "Computer Science",
  "Accounting",
  "Business Studies",
  "AI Productivity",
  "Reasoning",
  "Exam Prep",
] as const;

export const universityModuleOptions = [
  "Mathematics",
  "Computer Science",
  "Accounting",
  "Business Studies",
  "AI Productivity",
  "Reasoning",
  "Exam Prep",
] as const;

export const subjectOptions = [...schoolSubjectOptions, ...universityModuleOptions] as const;

export type EducationLevel = (typeof educationLevels)[number];
export type CurriculumOrInstitution = typeof schoolCurriculum | (typeof institutionOptions)[number] | string;
export type GradeOrYear = (typeof gradeOrYearOptions)[number] | string;

export type AcademicProfile = {
  educationLevel: EducationLevel;
  curriculumOrInstitution: CurriculumOrInstitution;
  gradeOrYear: GradeOrYear;
  subjectsOrModules: string[];
};

export function isAcademicProfile(value: unknown): value is AcademicProfile {
  if (!value || typeof value !== "object") return false;

  const profile = value as Partial<AcademicProfile>;

  return (
    typeof profile.educationLevel === "string" &&
    typeof profile.curriculumOrInstitution === "string" &&
    typeof profile.gradeOrYear === "string" &&
    Array.isArray(profile.subjectsOrModules)
  );
}

export function isUniversityLevel(educationLevel: string) {
  return educationLevel === "University / Varsity";
}

export function getDefaultAcademicProfile(): AcademicProfile {
  return {
    educationLevel: "Senior",
    curriculumOrInstitution: schoolCurriculum,
    gradeOrYear: "Form 5",
    subjectsOrModules: [],
  };
}

export function getAcademicProfileOptions(profile: Pick<AcademicProfile, "educationLevel" | "gradeOrYear">) {
  if (isUniversityLevel(profile.educationLevel)) {
    return {
      curriculumLabel: "Institution",
      curriculumOptions: institutionOptions,
      gradeLabel: "Year",
      gradeOptions: ["Year 1", "Year 2", "Year 3", "Year 4"],
      subjectLabel: "Modules",
      subjectOptions: universityModuleOptions,
    };
  }

  const gradeOptions =
    profile.educationLevel === "Primary"
      ? ["Primary level"]
      : profile.educationLevel === "Junior"
        ? ["Form 1", "Form 2", "Form 3"]
        : ["Form 4", "Form 5"];

  return {
    curriculumLabel: "Curriculum",
    curriculumOptions: [schoolCurriculum],
    gradeLabel: "Grade",
    gradeOptions,
    subjectLabel: "Subjects",
    subjectOptions: schoolSubjectOptions,
  };
}

export function normalizeAcademicProfileForLevel(profile: AcademicProfile): AcademicProfile {
  const options = getAcademicProfileOptions(profile);
  const nextCurriculumOrInstitution = isUniversityLevel(profile.educationLevel)
    ? institutionOptions.includes(profile.curriculumOrInstitution as (typeof institutionOptions)[number])
      ? profile.curriculumOrInstitution
      : institutionOptions[0]
    : schoolCurriculum;
  const nextGradeOrYear = options.gradeOptions.includes(profile.gradeOrYear)
    ? profile.gradeOrYear
    : options.gradeOptions[0];

  return {
    ...profile,
    curriculumOrInstitution: nextCurriculumOrInstitution,
    gradeOrYear: nextGradeOrYear,
    subjectsOrModules: profile.subjectsOrModules.filter((subject) =>
      (options.subjectOptions as readonly string[]).includes(subject),
    ),
  };
}

export function isAcademicProfileComplete(profile: AcademicProfile | null) {
  if (!profile) return false;

  const normalizedProfile = normalizeAcademicProfileForLevel(profile);
  const hasSubjects = normalizedProfile.subjectsOrModules.length > 0;

  if (!hasSubjects) return false;

  if (isUniversityLevel(normalizedProfile.educationLevel)) {
    return institutionOptions.includes(normalizedProfile.curriculumOrInstitution as (typeof institutionOptions)[number]);
  }

  return normalizedProfile.curriculumOrInstitution === schoolCurriculum && normalizedProfile.gradeOrYear.length > 0;
}

export function loadAcademicProfile(): AcademicProfile | null {
  const storedProfile = window.localStorage.getItem(ACADEMIC_PROFILE_KEY);

  if (!storedProfile) {
    return null;
  }

  try {
    const parsedProfile = JSON.parse(storedProfile);
    return isAcademicProfile(parsedProfile) ? parsedProfile : null;
  } catch {
    window.localStorage.removeItem(ACADEMIC_PROFILE_KEY);
    return null;
  }
}

export function saveAcademicProfile(profile: AcademicProfile) {
  window.localStorage.setItem(ACADEMIC_PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(ACADEMIC_PROFILE_CHANGE_EVENT));
}

export function clearAcademicProfile() {
  window.localStorage.removeItem(ACADEMIC_PROFILE_KEY);
  window.dispatchEvent(new Event(ACADEMIC_PROFILE_CHANGE_EVENT));
}

function getAcademicProfileDraftKey(scope: string) {
  return `${ACADEMIC_PROFILE_DRAFT_KEY_PREFIX}:${scope}`;
}

export function loadAcademicProfileDraft(scope: string): AcademicProfile | null {
  const draftKey = getAcademicProfileDraftKey(scope);
  const storedDraft = window.localStorage.getItem(draftKey);

  if (!storedDraft) return null;

  try {
    const parsedDraft = JSON.parse(storedDraft);
    return isAcademicProfile(parsedDraft) ? parsedDraft : null;
  } catch {
    window.localStorage.removeItem(draftKey);
    return null;
  }
}

export function saveAcademicProfileDraft(scope: string, profile: AcademicProfile) {
  window.localStorage.setItem(getAcademicProfileDraftKey(scope), JSON.stringify(profile));
}

export function clearAcademicProfileDraft(scope: string) {
  window.localStorage.removeItem(getAcademicProfileDraftKey(scope));
}

export function dispatchAcademicProfileSyncStatus(status: AcademicProfileSyncStatus) {
  window.dispatchEvent(
    new CustomEvent<AcademicProfileSyncStatusDetail>(ACADEMIC_PROFILE_SYNC_STATUS_EVENT, {
      detail: { status },
    }),
  );
}

export function requestAcademicProfileSyncRetry() {
  window.dispatchEvent(new Event(ACADEMIC_PROFILE_SYNC_RETRY_EVENT));
}

export function formatAcademicProfile(profile: AcademicProfile) {
  const label = isUniversityLevel(profile.educationLevel) ? "Year" : "Grade";

  return `${profile.educationLevel} / ${profile.curriculumOrInstitution} / ${label}: ${profile.gradeOrYear}`;
}

export function courseMatchesAcademicProfile(course: Course, profile: AcademicProfile) {
  return profile.subjectsOrModules.some((subject) => {
    const normalizedSubject = subject.toLowerCase();

    return (
      course.subject.toLowerCase().includes(normalizedSubject) ||
      course.title.toLowerCase().includes(normalizedSubject) ||
      course.description.toLowerCase().includes(normalizedSubject)
    );
  });
}

export function quizMatchesAcademicProfile(quiz: Quiz, courses: Course[], profile: AcademicProfile) {
  const course = courses.find((item) => item.id === quiz.courseId);

  return course ? courseMatchesAcademicProfile(course, profile) : false;
}
