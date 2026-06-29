export type LessonTutorStatus = "ready" | "unavailable" | "error";

export type LessonTutorResponse = {
  status: LessonTutorStatus;
  lessonId: string;
  summary: string;
  keyIdeas: string[];
  checkForUnderstanding: {
    question: string;
    expectedAnswer: string;
  }[];
  commonMisconceptions: string[];
  nextStudyStep: string;
  groundedInLesson: true;
};
