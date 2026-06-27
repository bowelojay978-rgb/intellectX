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
  name: "Maya Chen",
  role: "AI Learning Explorer",
  avatar: "/avatars/2.jpg",
  studyStreak: 12,
  totalHours: 37,
  completedLessons: 14,
  averageQuizScore: 86,
  longestStreak: 18,
  weeklyActiveDays: ["Mon", "Tue", "Wed", "Fri", "Sat"],
  lastStudiedDate: "2026-06-26",
  enrolledCourseIds: ["ai-study-systems", "critical-thinking", "exam-accelerator"],
  recentLessonIds: ["memory-systems", "source-quality", "diagnostic-review"],
  quizScores: {
    "ai-study-systems-check": 92,
    "critical-thinking-check": 84,
    "exam-accelerator-check": 78,
  },
};
