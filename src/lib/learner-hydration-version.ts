export function hasNewerLocalEdit(hydrationStartedAtVersion: number, currentLocalEditVersion: number) {
  return currentLocalEditVersion > hydrationStartedAtVersion;
}
