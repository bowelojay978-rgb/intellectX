import { describe, expect, it } from "vitest";

import { approveCourse, createInstructorCourseDraft, saveInstructorCourseDraft } from "../../convex/courses";
import { generateStaffMediaUploadUrl, registerStaffMediaUpload } from "../../convex/staffMedia";
import { clerkIdentity, convexHandler, convexTestContext, InMemoryConvexDb } from "./helpers/in-memory-convex";

const INSTRUCTOR_A = "https://clerk.example|instructor_a";
const INSTRUCTOR_B = "https://clerk.example|instructor_b";
const ADMIN_A = "https://clerk.example|admin_a";

const draftArgs = {
  stableId: "course-new",
  slug: "course-new",
  title: "New Course",
  description: "A valid course description",
  subject: "Science",
  level: "Intermediate",
  duration: "2 hours",
  accent: "#123456",
};

describe("Convex privileged authorization", () => {
  it("denies learner and unknown roles from instructor operations", async () => {
    const db = new InMemoryConvexDb();

    await expect(
      convexHandler(createInstructorCourseDraft)(
        convexTestContext(db, clerkIdentity("learner_a", { staff: { role: "learner" } })),
        draftArgs,
      ),
    ).rejects.toThrow("trusted instructor or admin role is required");
    await expect(
      convexHandler(createInstructorCourseDraft)(
        convexTestContext(db, clerkIdentity("unknown_a", { staff: { role: "owner" } })),
        draftArgs,
      ),
    ).rejects.toThrow("trusted instructor or admin role is required");
  });

  it("denies instructors from admin-only operations", async () => {
    const db = new InMemoryConvexDb();
    const ctx = convexTestContext(db, clerkIdentity("instructor_a", { staff: { role: "instructor" } }));

    await expect(convexHandler(approveCourse)(ctx, { stableId: "submitted-course" })).rejects.toThrow(
      "trusted admin role is required",
    );
  });

  it("denies an instructor attempting to modify another instructor's course", async () => {
    const db = new InMemoryConvexDb({
      courses: [
        {
          _id: "course-b",
          ...draftArgs,
          stableId: "course-b",
          slug: "course-b",
          instructorId: INSTRUCTOR_B,
          reviewStatus: "draft",
          publicationStatus: "unpublished",
          updatedAt: 100,
        },
      ],
    });
    const ctx = convexTestContext(db, clerkIdentity("instructor_a", { staff: { role: "instructor" } }));

    await expect(
      convexHandler(saveInstructorCourseDraft)(ctx, {
        ...draftArgs,
        stableId: "course-b",
        slug: "course-b",
        existingStableId: "course-b",
        expectedUpdatedAt: 100,
        lessons: [],
        quizzes: [],
      }),
    ).rejects.toThrow("instructors can only manage their own courses");

    expect(db.rows("courses")[0]).toMatchObject({ instructorId: INSTRUCTOR_B, updatedAt: 100 });
    expect(db.rows("auditLogs")).toHaveLength(0);
  });

  it("writes server-attributed audit records for instructor and admin course operations", async () => {
    const db = new InMemoryConvexDb({
      courses: [
        {
          _id: "submitted-course-record",
          ...draftArgs,
          stableId: "submitted-course",
          slug: "submitted-course",
          instructorId: INSTRUCTOR_A,
          reviewStatus: "submitted_for_review",
          publicationStatus: "unpublished",
          updatedAt: 100,
        },
      ],
    });

    await convexHandler(createInstructorCourseDraft)(
      convexTestContext(db, clerkIdentity("instructor_a", { staff: { role: "instructor" } })),
      draftArgs,
    );
    await convexHandler(approveCourse)(convexTestContext(db, clerkIdentity("admin_a", { staff: { role: "admin" } })), {
      stableId: "submitted-course",
    });

    expect(db.rows("auditLogs")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "course.draft_created",
          actorUserId: INSTRUCTOR_A,
          actorRole: "instructor",
          targetId: "course-new",
        }),
        expect.objectContaining({
          eventType: "course.approved",
          actorUserId: ADMIN_A,
          actorRole: "admin",
          targetId: "submitted-course",
        }),
      ]),
    );
  });

  it("writes server-attributed audit records for privileged media operations", async () => {
    const db = new InMemoryConvexDb({
      _storage: [{ _id: "storage-video", contentType: "video/mp4", size: 1024 }],
    });
    const ctx = convexTestContext(db, clerkIdentity("instructor_a", { staff: { role: "instructor" } }));

    await convexHandler(generateStaffMediaUploadUrl)(ctx, {});
    await convexHandler(registerStaffMediaUpload)(ctx, { storageId: "storage-video", kind: "video" });

    expect(db.rows("auditLogs")).toContainEqual(
      expect.objectContaining({
        eventType: "staff_media.upload_url_generated",
        actorUserId: INSTRUCTOR_A,
        actorRole: "instructor",
        targetType: "staff_media_upload",
        targetId: INSTRUCTOR_A,
      }),
    );
    expect(db.rows("auditLogs")).toContainEqual(
      expect.objectContaining({
        eventType: "staff_media.registered",
        actorUserId: INSTRUCTOR_A,
        actorRole: "instructor",
        targetType: "staff_media",
        targetId: "storage-video",
        after: { kind: "video", contentType: "video/mp4", size: 1024 },
      }),
    );
  });
});
