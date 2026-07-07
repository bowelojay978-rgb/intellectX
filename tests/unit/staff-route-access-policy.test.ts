import { describe, expect, it } from "vitest";

import {
  canAccessStaffArea,
  canAccessStaffRoute,
  getStaffRouteRequirement,
  normalizeStaffRole,
} from "@/lib/staff-route-access-policy";

const instructorRoutes = ["/instructor", "/instructor/courses", "/instructor/courses/new"];
const adminRoutes = ["/admin", "/admin/course-review", "/admin/instructors"];
const staffRoutes = [...instructorRoutes, ...adminRoutes];

describe("staff route access policy", () => {
  it("normalizes supported staff roles and rejects unknown roles", () => {
    expect(normalizeStaffRole(" learner ")).toBe("learner");
    expect(normalizeStaffRole("INSTRUCTOR")).toBe("instructor");
    expect(normalizeStaffRole("Admin")).toBe("admin");
    expect(normalizeStaffRole("owner")).toBeNull();
    expect(normalizeStaffRole(null)).toBeNull();
    expect(normalizeStaffRole(undefined)).toBeNull();
  });

  it("defines route requirements for current placeholder staff routes", () => {
    for (const route of instructorRoutes) {
      expect(getStaffRouteRequirement(route)).toMatchObject({
        area: "instructor",
        allowedRoles: ["instructor", "admin"],
        knownRoute: true,
      });
    }

    for (const route of adminRoutes) {
      expect(getStaffRouteRequirement(route)).toMatchObject({
        area: "admin",
        allowedRoles: ["admin"],
        knownRoute: true,
      });
    }
  });

  it("denies learners and unknown roles on all staff routes", () => {
    for (const route of staffRoutes) {
      expect(canAccessStaffRoute("learner", route)).toBe(false);
      expect(canAccessStaffRoute("owner", route)).toBe(false);
      expect(canAccessStaffRoute(null, route)).toBe(false);
      expect(canAccessStaffRoute(undefined, route)).toBe(false);
    }
  });

  it("allows instructors on instructor routes only", () => {
    for (const route of instructorRoutes) {
      expect(canAccessStaffRoute("instructor", route)).toBe(true);
    }

    for (const route of adminRoutes) {
      expect(canAccessStaffRoute("instructor", route)).toBe(false);
    }
  });

  it("allows admins on admin and instructor routes", () => {
    for (const route of staffRoutes) {
      expect(canAccessStaffRoute("admin", route)).toBe(true);
    }
  });

  it("fails closed for unknown staff routes", () => {
    expect(getStaffRouteRequirement("/admin/settings")).toMatchObject({
      area: "admin",
      allowedRoles: [],
      knownRoute: false,
    });
    expect(getStaffRouteRequirement("/instructor/reports")).toMatchObject({
      area: "instructor",
      allowedRoles: [],
      knownRoute: false,
    });
    expect(canAccessStaffRoute("admin", "/admin/settings")).toBe(false);
    expect(canAccessStaffRoute("instructor", "/instructor/reports")).toBe(false);
  });

  it("does not classify non-staff routes as staff routes", () => {
    expect(getStaffRouteRequirement("/courses")).toBeNull();
    expect(getStaffRouteRequirement("/dashboard")).toBeNull();
    expect(getStaffRouteRequirement("/pricing")).toBeNull();
    expect(canAccessStaffRoute("admin", "/courses")).toBe(false);
  });

  it("checks staff area intent without route-specific permissions", () => {
    expect(canAccessStaffArea("learner", "instructor")).toBe(false);
    expect(canAccessStaffArea("learner", "admin")).toBe(false);
    expect(canAccessStaffArea("instructor", "instructor")).toBe(true);
    expect(canAccessStaffArea("instructor", "admin")).toBe(false);
    expect(canAccessStaffArea("admin", "instructor")).toBe(true);
    expect(canAccessStaffArea("admin", "admin")).toBe(true);
    expect(canAccessStaffArea("owner", "admin")).toBe(false);
  });
});
