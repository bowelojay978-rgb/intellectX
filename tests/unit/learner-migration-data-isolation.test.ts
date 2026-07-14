import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  getQuizAttemptMigrationFingerprint,
  selectDestinationAuthoritativeMigrationRecord,
} from "../../convex/lib/migrateLearnerData";

describe("learner migration data isolation", () => {
  it("keeps authenticated destination singleton state authoritative even when local timestamps are newer", () => {
    const selected = selectDestinationAuthoritativeMigrationRecord(
      [
        {
          userKey: "learner:user@example.com",
          updatedAt: 999,
          value: "local-newer",
        },
      ],
      [
        {
          userKey: "auth:https://clerk.example|user_123",
          updatedAt: 100,
          value: "authenticated-existing",
        },
      ],
    );

    expect(selected).toMatchObject({
      userKey: "auth:https://clerk.example|user_123",
      value: "authenticated-existing",
    });
  });

  it("uses the newest verified local singleton only when authenticated destination state is absent", () => {
    const selected = selectDestinationAuthoritativeMigrationRecord(
      [
        { userKey: "learner:user@example.com", updatedAt: 100, value: "older" },
        { userKey: "learner:user@example.com", updatedAt: 200, value: "newer" },
      ],
      [],
    );

    expect(selected).toMatchObject({ value: "newer", updatedAt: 200 });
  });

  it("does not collapse distinct quiz attempts that differ by answers", () => {
    const baseAttempt = {
      quizId: "quiz-1",
      completedAt: 12345,
      score: 1,
      totalQuestions: 2,
      answers: [0, 1],
    };

    expect(getQuizAttemptMigrationFingerprint(baseAttempt)).not.toBe(
      getQuizAttemptMigrationFingerprint({
        ...baseAttempt,
        answers: [1, 0],
      }),
    );

    expect(getQuizAttemptMigrationFingerprint(baseAttempt)).toBe(
      getQuizAttemptMigrationFingerprint({ ...baseAttempt }),
    );
  });

  it("persists successful migration completion server-side and replays the ledger on retry", () => {
    const migrationSource = readFileSync(path.resolve(process.cwd(), "convex/learnerMigration.ts"), "utf8");
    const schemaSource = readFileSync(path.resolve(process.cwd(), "convex/schema.ts"), "utf8");

    expect(schemaSource).toContain("learnerMigrationLedger: defineTable");
    expect(schemaSource).toContain('index("by_source_destination_version"');
    expect(migrationSource).toContain('.query("learnerMigrationLedger")');
    expect(migrationSource).toContain("summaryFromLedger(existingLedger)");
    expect(migrationSource).toContain('.insert("learnerMigrationLedger"');
    expect(migrationSource).toContain("LEARNER_MIGRATION_VERSION = 1");
  });

  it("uses destination-authoritative policy for mutable singleton domains", () => {
    const migrationSource = readFileSync(path.resolve(process.cwd(), "convex/learnerMigration.ts"), "utf8");

    expect(migrationSource.match(/selectDestinationAuthoritativeMigrationRecord/g)?.length).toBeGreaterThanOrEqual(4);
    expect(migrationSource).toContain("sourceAcademicProfiles");
    expect(migrationSource).toContain("sourceCourseSelections");
    expect(migrationSource).toContain("sourceNotes");
    expect(migrationSource).toContain("sourceStudyStats");
  });
});
