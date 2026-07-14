import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  selectDestinationAuthoritativeRecordForMigration,
  selectMonotonicLessonProgressForMigration,
} from "../../convex/lib/migrateLearnerData";

describe("learner migration lesson-progress integrity", () => {
  it("never lets newer lower progress overwrite an older completed lesson", () => {
    const result = selectMonotonicLessonProgressForMigration([
      {
        userKey: "auth:user-1",
        lessonId: "lesson-1",
        status: "completed",
        progress: 100,
        updatedAt: 100,
      },
      {
        userKey: "learner:user@example.com",
        lessonId: "lesson-1",
        status: "in_progress",
        progress: 25,
        updatedAt: 200,
      },
    ]);

    expect(result).toMatchObject({
      userKey: "auth:user-1",
      progress: 100,
      status: "completed",
      updatedAt: 100,
    });
  });

  it("uses the newer record only when progress is equal", () => {
    const result = selectMonotonicLessonProgressForMigration([
      {
        userKey: "auth:user-1",
        lessonId: "lesson-1",
        status: "in_progress",
        progress: 50,
        updatedAt: 100,
      },
      {
        userKey: "learner:user@example.com",
        lessonId: "lesson-1",
        status: "in_progress",
        progress: 50,
        updatedAt: 200,
      },
    ]);

    expect(result).toMatchObject({
      userKey: "learner:user@example.com",
      progress: 50,
      updatedAt: 200,
    });
  });

  it("prefers authenticated destination progress on an exact tie so retries are idempotent", () => {
    const result = selectMonotonicLessonProgressForMigration(
      [
        {
          userKey: "learner:user@example.com",
          lessonId: "lesson-1",
          status: "in_progress",
          progress: 50,
          updatedAt: 200,
        },
        {
          userKey: "auth:user-1",
          lessonId: "lesson-1",
          status: "in_progress",
          progress: 50,
          updatedAt: 200,
        },
      ],
      "auth:user-1",
    );

    expect(result).toMatchObject({
      userKey: "auth:user-1",
      progress: 50,
      updatedAt: 200,
    });
  });

  it("clamps legacy progress and normalizes 100 percent to completed", () => {
    const result = selectMonotonicLessonProgressForMigration([
      {
        userKey: "learner:user@example.com",
        lessonId: "lesson-1",
        status: "in_progress",
        progress: 150,
        updatedAt: 200,
      },
    ]);

    expect(result).toMatchObject({
      progress: 100,
      status: "completed",
    });
  });

  it("returns null for empty input", () => {
    expect(selectMonotonicLessonProgressForMigration([])).toBeNull();
  });
});

describe("learner migration destination authority", () => {
  it("keeps existing authenticated destination data even when browser-local data has a newer timestamp", () => {
    const result = selectDestinationAuthoritativeRecordForMigration(
      [{ userKey: "learner:user@example.com", updatedAt: 500, value: "local" }],
      [{ userKey: "auth:user-1", updatedAt: 100, value: "authenticated" }],
    );

    expect(result).toEqual({
      userKey: "auth:user-1",
      updatedAt: 100,
      value: "authenticated",
    });
  });

  it("imports the newest local record when authenticated destination data does not exist", () => {
    const result = selectDestinationAuthoritativeRecordForMigration(
      [
        { userKey: "learner:user@example.com", updatedAt: 100, value: "older" },
        { userKey: "learner:user@example.com", updatedAt: 300, value: "newest" },
      ],
      [],
    );

    expect(result).toEqual({
      userKey: "learner:user@example.com",
      updatedAt: 300,
      value: "newest",
    });
  });

  it("wires destination authority into singleton records, notes, and lesson-progress retry behavior", () => {
    const source = readFileSync(path.resolve(process.cwd(), "convex/learnerMigration.ts"), "utf8");

    expect(source.match(/selectDestinationAuthoritativeRecordForMigration\(/g)?.length).toBeGreaterThanOrEqual(4);
    expect(source).toContain("selectedAcademicProfile && !destinationAcademicProfile");
    expect(source).toContain("selectedCourseSelection && !destinationCourseSelection");
    expect(source).toContain("if (!selectedNote || destinationNote)");
    expect(source).toContain("selectedStudyStats && !destinationStudyStatsRecord");
    expect(source).toMatch(/selectMonotonicLessonProgressForMigration\([\s\S]*?destinationUserKey,\s*\);/);
  });
});
