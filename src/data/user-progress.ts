export type UserProgress = {
  name: string;
  role: string;
  avatar: string;
  studyStreak: number;
  totalHours: number;
  completedLessons: number;
  averageQuizScore: number;
  longestStreak: number;
  weeklyActiveDays: string[];
  lastStudiedDate: string;
  enrolledCourseIds: string[];
  recentLessonIds: string[];
  quizScores: Record<string, number>;
};

export const userProgress: UserProgress = {
  name: "IntellectX Learner",
  role: "AI Learning Explorer",
  avatar: "/avatars/2.jpg",
  studyStreak: 0,
  totalHours: 0,
  completedLessons: 0,
  averageQuizScore: 0,
  longestStreak: 0,
  weeklyActiveDays: [],
  lastStudiedDate: "Sync pending",
  enrolledCourseIds: ["ai-study-systems", "critical-thinking", "exam-accelerator"],
  recentLessonIds: ["memory-systems", "source-quality", "diagnostic-review"],
  quizScores: {
    "ai-study-systems-check": 0,
    "critical-thinking-check": 0,
    "exam-accelerator-check": 0,
  },
};


