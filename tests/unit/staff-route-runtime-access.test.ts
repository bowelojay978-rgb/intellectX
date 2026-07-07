import { describe, expect, it } from "vitest";

import {
  resolveStaffRouteAccess,
  resolveTrustedStaffRoleFromClaims,
} from "@/lib/staff-route-runtime-access";

describe("staff route runtime access", () => {
  it("resolves trusted roles from signed claim metadata only", () => {
    expect(resolveTrustedStaffRoleFromClaims({ metadata: { role: "admin" } })).toBe("admin");
    expect(resolveTrustedStaffRoleFromClaims({ publicMetadata: { role: "instructor" } })).toBe("instructor");
    expect(resolveTrustedStaffRoleFromClaims({ appMetadata: { role: "learner" } })).toBe("learner");
    expect(resolveTrustedStaffRoleFromClaims({ staff: { role: "ADMIN" } })).toBe("admin");
  });

  it("rejects missing, unknown, and unsafe role claims", () => {
    expect(resolveTrustedStaffRoleFromClaims(null)).toBeNull();
    expect(resolveTrustedStaffRoleFromClaims({})).toBeNull();
    expect(resolveTrustedStaffRoleFromClaims({ metadata: { role: "owner" } })).toBeNull();
    expect(resolveTrustedStaffRoleFromClaims({ unsafeMetadata: { role: "admin" } })).toBeNull();
    expect(resolveTrustedStaffRoleFromClaims({ role: "admin" })).toBeNull();
  });

  it("denies unauthenticated or missing trusted role access to staff routes", () => {
    expect(resolveStaffRouteAccess(null, "/admin")).toMatchObject({
      allowed: false,
      role: null,
      reason: "missing_role",
    });
    expect(resolveStaffRouteAccess(undefined, "/instructor")).toMatchObject({
      allowed: false,
      role: null,
      reason: "missing_role",
    });
  });

  it("denies learner and unknown roles on staff routes", () => {
    expect(resolveStaffRouteAccess("learner", "/admin")).toMatchObject({
      allowed: false,
      role: "learner",
      reason: "denied",
    });
    expect(resolveStaffRouteAccess("owner", "/admin")).toMatchObject({
      allowed: false,
      role: null,
      reason: "missing_role",
    });
  });

  it("allows instructors on instructor routes only", () => {
    expect(resolveStaffRouteAccess("instructor", "/instructor")).toMatchObject({
      allowed: true,
      role: "instructor",
      reason: "allowed",
    });
    expect(resolveStaffRouteAccess("instructor", "/instructor/courses/new")).toMatchObject({
      allowed: true,
      role: "instructor",
      reason: "allowed",
    });
    expect(resolveStaffRouteAccess("instructor", "/admin")).toMatchObject({
      allowed: false,
      role: "instructor",
      reason: "denied",
    });
  });

  it("allows admins on admin and instructor routes", () => {
    expect(resolveStaffRouteAccess("admin", "/admin/course-review")).toMatchObject({
      allowed: true,
      role: "admin",
      reason: "allowed",
    });
    expect(resolveStaffRouteAccess("admin", "/instructor/courses")).toMatchObject({
      allowed: true,
      role: "admin",
      reason: "allowed",
    });
  });

  it("fails closed for unknown staff routes and ignores non-staff routes", () => {
    expect(resolveStaffRouteAccess("admin", "/admin/settings")).toMatchObject({
      allowed: false,
      role: "admin",
      reason: "denied",
    });
    expect(resolveStaffRouteAccess("admin", "/courses")).toMatchObject({
      allowed: false,
      role: null,
      reason: "not_staff_route",
    });
  });
});
