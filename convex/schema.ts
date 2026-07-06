import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    role: v.string(),
    avatar: v.optional(v.string()),
  }),
  courses: defineTable({
    stableId: v.string(),
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    subject: v.string(),
    level: v.string(),
    duration: v.string(),
    accent: v.string(),
    accessLevel: v.optional(v.union(v.literal("free"), v.literal("paid"))),
  })
    .index("by_stable_id", ["stableId"])
    .index("by_slug", ["slug"]),
  lessons: defineTable({
    stableId: v.string(),
    courseStableId: v.string(),
    title: v.string(),
    duration: v.string(),
    summary: v.string(),
    content: v.array(v.string()),
    videoUrl: v.optional(v.string()),
    posterUrl: v.optional(v.string()),
    accessLevel: v.optional(v.union(v.literal("free"), v.literal("paid"))),
    order: v.number(),
  })
    .index("by_stable_id", ["stableId"])
    .index("by_course_stable_id", ["courseStableId"]),
  quizzes: defineTable({
    stableId: v.string(),
    courseStableId: v.string(),
    lessonStableId: v.optional(v.string()),
    title: v.string(),
    difficulty: v.string(),
    estimatedTime: v.string(),
    accessLevel: v.optional(v.union(v.literal("free"), v.literal("paid"))),
  })
    .index("by_stable_id", ["stableId"])
    .index("by_course_stable_id", ["courseStableId"]),
  questions: defineTable({
    stableId: v.string(),
    quizStableId: v.string(),
    prompt: v.string(),
    choices: v.array(v.string()),
    answerIndex: v.number(),
    explanation: v.string(),
    order: v.number(),
  })
    .index("by_stable_id", ["stableId"])
    .index("by_quiz_stable_id", ["quizStableId"]),
  enrollments: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    progress: v.number(),
    status: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_course", ["courseId"]),
  lessonProgress: defineTable({
    userId: v.optional(v.id("users")),
    userKey: v.string(),
    lessonId: v.string(),
    status: v.string(),
    progress: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userKey"])
    .index("by_lesson", ["lessonId"]),
  quizAttempts: defineTable({
    userId: v.optional(v.id("users")),
    userKey: v.string(),
    quizId: v.string(),
    score: v.number(),
    totalQuestions: v.number(),
    answers: v.array(v.number()),
    quizTitle: v.optional(v.string()),
    percentage: v.optional(v.number()),
    completedAt: v.number(),
  })
    .index("by_user", ["userKey"])
    .index("by_quiz", ["quizId"]),
  studyStats: defineTable({
    userId: v.optional(v.id("users")),
    userKey: v.string(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    weeklyActiveDays: v.array(v.string()),
    lastStudiedDate: v.string(),
    updatedAt: v.number(),
  }).index("by_user", ["userKey"]),
  courseSelections: defineTable({
    userId: v.optional(v.id("users")),
    userKey: v.string(),
    selectedCourseIds: v.array(v.string()),
    selectedAt: v.union(v.number(), v.null()),
    gracePeriodEndsAt: v.union(v.number(), v.null()),
    lockedAt: v.union(v.number(), v.null()),
    locked: v.boolean(),
    updatedAt: v.number(),
  }).index("by_user", ["userKey"]),
  notes: defineTable({
    userId: v.optional(v.id("users")),
    userKey: v.string(),
    lessonId: v.string(),
    body: v.string(),
    updatedAt: v.number(),
  })
    .index("by_user_lesson", ["userKey", "lessonId"])
    .index("by_lesson", ["lessonId"]),
  academicProfiles: defineTable({
    userId: v.optional(v.id("users")),
    userKey: v.string(),
    educationLevel: v.string(),
    curriculumOrInstitution: v.string(),
    gradeOrYear: v.string(),
    subjectsOrModules: v.array(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userKey"]),
  entitlements: defineTable({
    userKey: v.string(),
    productKey: v.string(),
    status: v.union(
      v.literal("none"),
      v.literal("active"),
      v.literal("expired"),
      v.literal("cancelled"),
      v.literal("refunded"),
      v.literal("payment_failed"),
    ),
    currentPeriodEndsAt: v.optional(v.number()),
    provider: v.optional(v.string()),
    providerCustomerId: v.optional(v.string()),
    providerSubscriptionId: v.optional(v.string()),
    providerEventId: v.optional(v.string()),
    lastBillingEventType: v.optional(
      v.union(
        v.literal("checkout_completed"),
        v.literal("subscription_created"),
        v.literal("subscription_renewed"),
        v.literal("subscription_cancelled"),
        v.literal("subscription_expired"),
        v.literal("payment_failed"),
        v.literal("payment_refunded"),
      ),
    ),
    updatedAt: v.number(),
  })
    .index("by_user", ["userKey"])
    .index("by_user_product", ["userKey", "productKey"])
    .index("by_user_product_provider_subscription", ["userKey", "productKey", "provider", "providerSubscriptionId"])
    .index("by_product_status", ["productKey", "status"]),
});


