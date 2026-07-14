export const managedInstructorRoles = ["learner", "instructor"] as const;
export type ManagedInstructorRole = (typeof managedInstructorRoles)[number];

export const staffRoleChangeAuditPhases = ["requested", "completed", "failed"] as const;
export type StaffRoleChangeAuditPhase = (typeof staffRoleChangeAuditPhases)[number];

export function assertManagedInstructorRoleTransition(
  previousRole: ManagedInstructorRole,
  nextRole: ManagedInstructorRole,
) {
  if (previousRole === nextRole) {
    throw new Error("Instructor access audit requires an actual role change.");
  }
}

export function getStaffRoleChangeAuditEventType(
  phase: StaffRoleChangeAuditPhase,
  nextRole: ManagedInstructorRole,
) {
  if (phase === "requested") {
    return "staff_instructor_access_change_requested";
  }

  if (phase === "failed") {
    return "staff_instructor_access_change_failed";
  }

  return nextRole === "instructor"
    ? "staff_instructor_access_granted"
    : "staff_instructor_access_revoked";
}
