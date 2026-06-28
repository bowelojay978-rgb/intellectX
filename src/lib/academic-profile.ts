import type { Course } from "@/data/courses";
import type { Quiz } from "@/data/quizzes";

export const ACADEMIC_PROFILE_KEY = "intellectx:academic-profile";

export const educationLevels = [
  "Primary",
  "Junior Secondary",
  "Senior Secondary",
  "Varsity / University",
  "Professional / Other",
] as const;

export const curriculumOptions = ["Botswana", "Cambridge", "Other", "University / Institution"] as const;

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

export const subjectOptions = [
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

export type EducationLevel = (typeof educationLevels)[number];
export type CurriculumOrInstitution = (typeof curriculumOptions)[number] | string;
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
  window.dispatchEvent(new Event("intellectx-academic-profile-change"));
}

export function clearAcademicProfile() {
  window.localStorage.removeItem(ACADEMIC_PROFILE_KEY);
  window.dispatchEvent(new Event("intellectx-academic-profile-change"));
}

export function formatAcademicProfile(profile: AcademicProfile) {
  return `${profile.educationLevel} / ${profile.curriculumOrInstitution} / ${profile.gradeOrYear}`;
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
