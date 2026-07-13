import type { UserIdentity } from "convex/server";
import { describe, expect, it } from "vitest";

import {
  ADMIN,
  INSTRUCTOR,
  canManageInstructorCourse,
  canReviewCourse,
  requireAdmin,
  requireInstructorOrAdmin,
  resolveStaffRoleFromIdentity,
} from "../../convex/lib/staffRbac";

function identity(overrides: Partial<UserIdentity> = {}): UserIdentity {
  return {
    tokenIdentifier: "https://clerk.example|user_123",
    subject: "user_123",
    issuer: "https://clerk.example",
    ...overrides,
  };
}

describe("Convex staff RBAC", () => {
  it("denies missing identity and missing staff role claims", () => {
    expect(resolveStaffRoleFromIdentity(null)).toBeNull();
    expect(resolveStaffRoleFromIdentity(identity())).toBeNull();
    expect(() => requireInstructorOrAdmin(null)).toThrow("trusted instructor or admin role is required");
    expect(() => requireAdmin(identity())).toThrow("trusted admin role is required");
  });

  it("denies malformed or unknown role claims", () => {
    expect(resolveStaffRoleFromIdentity(identity({ staff: { role: "owner" } }))).toBeNull();
    expect(resolveStaffRoleFromIdentity(identity({ staff: { role: ["admin"] } }))).toBeNull();
    expect(resolveStaffRoleFromIdentity(identity({ staff: { role: " " } }))).toBeNull();
  });

  it("accepts only learner, instructor, and admin trusted claim roles", () => {
    expect(resolveStaffRoleFromIdentity(identity({ staff: { role: "learner" } }))).toBe("learner");
    expect(resolveStaffRoleFromIdentity(identity({ metadata: { role: "admin" } }))).toBe("admin");
    expect(resolveStaffRoleFromIdentity(identity({ publicMetadata: { role: "instructor" } }))).toBe("instructor");
    expect(resolveStaffRoleFromIdentity(identity({ appMetadata: { role: "learner" } }))).toBe("learner");
    expect(resolveStaffRoleFromIdentity(identity({ staff: { role: "INSTRUCTOR" } }))).toBe("instructor");
    expect(resolveStaffRoleFromIdentity(identity({ staff: { role: " admin " } }))).toBe("admin");
  });

  it("uses staff.role as the canonical trusted claim when signed claim paths conflict", () => {
    expect(
      resolveStaffRoleFromIdentity(
        identity({
          staff: { role: "learner" },
          metadata: { role: "admin" },
          publicMetadata: { role: "instructor" },
          appMetadata: { role: "admin" },
        }),
      ),
    ).toBe("learner");

    expect(
      resolveStaffRoleFromIdentity(
        identity({
          staff: { role: "admin" },
          metadata: { role: "learner" },
        }),
      ),
    ).toBe("admin");
  });

  it("does not trust root or unsafe metadata role values", () => {
    expect(resolveStaffRoleFromIdentity(identity({ role: "admin" }))).toBeNull();
    expect(resolveStaffRoleFromIdentity(identity({ unsafeMetadata: { role: "admin" } }))).toBeNull();
  });

  it("denies learners for staff mutation intent", () => {
    expect(() => requireInstructorOrAdmin(identity({ staff: { role: "learner" } }))).toThrow(
      "trusted instructor or admin role is required",
    );
  });

  it("allows instructors to create drafts and submit their own courses only", () => {
    const actor = requireInstructorOrAdmin(identity({ staff: { role: INSTRUCTOR } }));

    expect(actor).toEqual({
      actorUserId: "https://clerk.example|user_123",
      role: "instructor",
    });
    expect(canManageInstructorCourse(actor.role, { instructorId: actor.actorUserId }, actor.actorUserId)).toBe(true);
    expect(canManageInstructorCourse(actor.role, { instructorId: "other-user" }, actor.actorUserId)).toBe(false);
    expect(canReviewCourse(actor.role)).toBe(false);
  });

  it("denies instructors admin review and publish intent", () => {
    expect(() => requireAdmin(identity({ staff: { role: INSTRUCTOR } }))).toThrow("trusted admin role is required");
  });

  it("allows admins to review and manage instructor courses", () => {
    const actor = requireAdmin(identity({ staff: { role: ADMIN } }));

    expect(actor).toEqual({
      actorUserId: "https://clerk.example|user_123",
      role: "admin",
    });
    expect(canReviewCourse(actor.role)).toBe(true);
    expect(canManageInstructorCourse(actor.role, { instructorId: "other-user" }, actor.actorUserId)).toBe(true);
  });
});
