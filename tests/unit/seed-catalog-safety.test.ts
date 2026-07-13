import { describe, expect, it } from "vitest";

import {
  shouldRemoveObsoleteSeedManagedCatalogRecord,
  shouldRunSeedCleanup,
} from "../../convex/lib/seedCatalogSafety";

describe("seed catalog safety", () => {
  it("does not run destructive cleanup unless reset is explicitly true", () => {
    expect(shouldRunSeedCleanup(undefined)).toBe(false);
    expect(shouldRunSeedCleanup(false)).toBe(false);
    expect(shouldRunSeedCleanup(true)).toBe(true);
  });

  it("never removes instructor or legacy records that are not explicitly seed-managed", () => {
    const currentSeedIds = new Set(["seed-course"]);

    expect(
      shouldRemoveObsoleteSeedManagedCatalogRecord(
        { stableId: "instructor-course" },
        currentSeedIds,
      ),
    ).toBe(false);
    expect(
      shouldRemoveObsoleteSeedManagedCatalogRecord(
        { stableId: "legacy-course", seedManaged: false },
        currentSeedIds,
      ),
    ).toBe(false);
  });

  it("keeps current seed-managed records and removes only obsolete seed-managed records", () => {
    const currentSeedIds = new Set(["current-seed-course"]);

    expect(
      shouldRemoveObsoleteSeedManagedCatalogRecord(
        { stableId: "current-seed-course", seedManaged: true },
        currentSeedIds,
      ),
    ).toBe(false);
    expect(
      shouldRemoveObsoleteSeedManagedCatalogRecord(
        { stableId: "obsolete-seed-course", seedManaged: true },
        currentSeedIds,
      ),
    ).toBe(true);
  });
});
