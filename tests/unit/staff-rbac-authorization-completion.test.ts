import { readFileSync } from "node:fs";
import path from "node:path";
import type { UserIdentity } from "convex/server";
import { describe, expect, it } from "vitest";

import {
  assertManagedInstructorRoleTransition,
  getStaffRoleChangeAuditEventType,
} from "../../convex/lib/staffRoleChangeAudit";
import {
  requireInstructorOrAdmin,
  resolveStaffRoleFromIdentity,
} from "../../convex/lib/staffRbac";
import {
  resolveStaffRouteAccess,
  resolveTrustedStaffRoleFromClaims,
} from "@/lib/staff-route-runtime-access";

function identity(overrides: Partial<UserIdentity> = {}): UserIdentity {
  return {
    tokenIdentifier: "https://clerk.example|user_123",
    subject: "user_123",
    issuer: "https://clerk.example",
    ...overrides,
  };
}

describe("staff RBAC and authorization completion", () => {
  it("maps requested, completed, and failed instructor role-change audit events explicitly", () => {
    expect(getStaffRoleChangeAuditEventType("requested", "instructor")).toBe(
      "staff_instructor_access_change_requested",
    );
    expect(getStaffRoleChangeAuditEventType("completed", "instructor")).toBe(
      "staff_instructor_access_granted",
    );
    expect(getStaffRoleChangeAuditEventType("completed", "learner")).toBe(
      "staff_instructor_access_revoked",
    );
    expect(getStaffRoleChangeAuditEventType("failed", "learner")).toBe(
      "staff_instructor_access_change_failed",
    );
  });

  it("rejects audit noise for no-op role transitions", () => {
    expect(() => assertManagedInstructorRoleTransition("learner", "learner")).toThrow(
      "requires an actual role change",
    );
    expect(() => assertManagedInstructorRoleTransition("instructor", "instructor")).toThrow(
      "requires an actual role change",
    );
    expect(() => assertManagedInstructorRoleTransition("learner", "instructor")).not.toThrow();
  });

  it("fails closed after refreshed claims demote an instructor to learner", () => {
    const revokedClaims = {
      staff: { role: "learner" },
      metadata: { role: "admin" },
      publicMetadata: { role: "instructor" },
    };

    expect(resolveTrustedStaffRoleFromClaims(revokedClaims)).toBe("learner");
    expect(resolveStaffRouteAccess("learner", "/instructor/courses")).toMatchObject({
      allowed: false,
      role: "learner",
      reason: "denied",
    });

    const revokedIdentity = identity(revokedClaims);
    expect(resolveStaffRoleFromIdentity(revokedIdentity)).toBe("learner");
    expect(() => requireInstructorOrAdmin(revokedIdentity)).toThrow(
      "trusted instructor or admin role is required",
    );
  });

  it("requires server-authorized, idempotent audit logging around Clerk metadata changes", () => {
    const actionSource = readFileSync(
      path.resolve(process.cwd(), "src/app/admin/instructors/actions.ts"),
      "utf8",
    );
    const auditMutationSource = readFileSync(
      path.resolve(process.cwd(), "convex/staffSecurityAudit.ts"),
      "utf8",
    );

    expect(actionSource).toContain("getAdminClerkSession");
    expect(actionSource).toContain("currentRole === nextRole");
    expect(actionSource).toContain("fetchMutation");
    expect(actionSource).toContain("getToken()");

    const requestAuditPosition = actionSource.indexOf('phase: "requested"');
    const clerkUpdatePosition = actionSource.indexOf("updateUserMetadata");
    const completionAuditPosition = actionSource.indexOf('phase: "completed"');

    expect(requestAuditPosition).toBeGreaterThanOrEqual(0);
    expect(clerkUpdatePosition).toBeGreaterThan(requestAuditPosition);
    expect(completionAuditPosition).toBeGreaterThan(clerkUpdatePosition);

    expect(auditMutationSource).toContain("requireAdmin(identity)");
    expect(auditMutationSource).toContain('withIndex("by_target"');
    expect(auditMutationSource).toContain('targetType: "clerk_user"');
    expect(auditMutationSource).toContain("duplicateEvent");
    expect(auditMutationSource).toContain("operationId: args.operationId");
  });
});
