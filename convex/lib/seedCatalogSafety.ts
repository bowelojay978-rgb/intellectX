export type SeedManagedCatalogRecord = {
  stableId: string;
  seedManaged?: boolean;
};

export function shouldRunSeedCleanup(reset: boolean | undefined) {
  return reset === true;
}

export function shouldRemoveObsoleteSeedManagedCatalogRecord(
  record: SeedManagedCatalogRecord,
  currentSeedStableIds: ReadonlySet<string>,
) {
  return record.seedManaged === true && !currentSeedStableIds.has(record.stableId);
}
