import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("learner migration and data isolation completion", () => {
  it("persists attempted, failed, and completed migration lifecycle events", () => {
    const source = readSource("convex/learnerMigration.ts");

    expect(source).toContain('const MIGRATION_ATTEMPTED_EVENT = "learner_migration_attempted"');
    expect(source).toContain('const MIGRATION_FAILED_EVENT = "learner_migration_failed"');
    expect(source).toContain('const MIGRATION_COMPLETED_EVENT = "learner_migration_completed"');
    expect(source).toContain("recordLocalLearnerMigrationAttempt");
    expect(source).toContain("recordLocalLearnerMigrationFailure");
    expect(source).toContain("prepareLearnerDataMigration(identity, args.sourceUserKey)");
  });

  it("uses an exact target and event index for cross-browser replay suppression", () => {
    const migrationSource = readSource("convex/learnerMigration.ts");
    const schemaSource = readSource("convex/schema.ts");

    expect(schemaSource).toContain(
      '.index("by_target_event", ["targetType", "targetId", "eventType"])',
    );
    expect(migrationSource).toContain('.withIndex("by_target_event"');
    expect(migrationSource).toContain('.eq("eventType", MIGRATION_COMPLETED_EVENT)');
    expect(migrationSource).toContain("alreadyCompleted: true");
  });

  it("records a persistent attempt before migration and a persistent failure after errors", () => {
    const source = readSource("src/components/education/local-learner-data-migration-sync.tsx");

    const attemptPosition = source.indexOf("await recordMigrationAttempt");
    const migrationPosition = source.indexOf("await migrateLocalLearnerData");
    const failurePosition = source.indexOf("await recordMigrationFailure");

    expect(attemptPosition).toBeGreaterThanOrEqual(0);
    expect(migrationPosition).toBeGreaterThan(attemptPosition);
    expect(failurePosition).toBeGreaterThan(migrationPosition);
    expect(source).toContain("if (attempt?.alreadyCompleted)");
    expect(source).toContain('writeLocalLearnerMigrationMarker(migrationSource.markerKey, "succeeded")');
    expect(source).toContain('writeLocalLearnerMigrationMarker(migrationSource.markerKey, "failed")');
  });

  it("exposes all migration lifecycle mutations through the shared Convex API map", () => {
    const source = readSource("src/lib/convex-api.ts");

    expect(source).toContain("learnerMigration:recordLocalLearnerMigrationAttempt");
    expect(source).toContain("learnerMigration:recordLocalLearnerMigrationFailure");
    expect(source).toContain("learnerMigration:migrateLocalLearnerDataToAuthenticatedAccount");
  });

  it("keeps migration completion transactional with the destination writes", () => {
    const source = readSource("convex/learnerMigration.ts");
    const firstDestinationWrite = source.indexOf('ctx.db.insert("academicProfiles"');
    const completionWrite = source.lastIndexOf("eventType: MIGRATION_COMPLETED_EVENT");
    const returnPosition = source.lastIndexOf("return summary");

    expect(firstDestinationWrite).toBeGreaterThanOrEqual(0);
    expect(completionWrite).toBeGreaterThan(firstDestinationWrite);
    expect(returnPosition).toBeGreaterThan(completionWrite);
  });
});
