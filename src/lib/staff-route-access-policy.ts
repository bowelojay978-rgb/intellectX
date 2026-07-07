import { ADMIN, INSTRUCTOR, LEARNER } from "@/lib/course-workflow-policy";

export const staffAreas = ["instructor", "admin"] as const;
export const staffRoles = [LEARNER, INSTRUCTOR, ADMIN] as const;

export type StaffArea = (typeof staffAreas)[number];
export type StaffRole = (typeof staffRoles)[number];

export type StaffRouteRequirement = {
  area: StaffArea;
  allowedRoles: readonly StaffRole[];
  knownRoute: boolean;
};

const staffRouteRequirements: Record<string, StaffRouteRequirement> = {
  "/instructor": {
    area: "instructor",
    allowedRoles: [INSTRUCTOR, ADMIN],
    knownRoute: true,
  },
  "/instructor/courses": {
    area: "instructor",
    allowedRoles: [INSTRUCTOR, ADMIN],
    knownRoute: true,
  },
  "/instructor/courses/new": {
    area: "instructor",
    allowedRoles: [INSTRUCTOR, ADMIN],
    knownRoute: true,
  },
  "/admin": {
    area: "admin",
    allowedRoles: [ADMIN],
    knownRoute: true,
  },
  "/admin/course-review": {
    area: "admin",
    allowedRoles: [ADMIN],
    knownRoute: true,
  },
  "/admin/instructors": {
    area: "admin",
    allowedRoles: [ADMIN],
    knownRoute: true,
  },
};

function normalizePathname(pathname: string) {
  const [pathWithoutQuery] = pathname.split(/[?#]/);
  const normalizedPath = pathWithoutQuery.trim().replace(/\/+$/, "");

  return normalizedPath || "/";
}

function isStaffRoutePath(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/instructor" ||
    pathname.startsWith("/instructor/")
  );
}

export function normalizeStaffRole(value: string | null | undefined): StaffRole | null {
  const normalizedRole = value?.trim().toLowerCase();

  if (normalizedRole === LEARNER || normalizedRole === INSTRUCTOR || normalizedRole === ADMIN) {
    return normalizedRole;
  }

  return null;
}

export function getStaffRouteRequirement(pathname: string): StaffRouteRequirement | null {
  const normalizedPathname = normalizePathname(pathname);
  const requirement = staffRouteRequirements[normalizedPathname];

  if (requirement) {
    return requirement;
  }

  if (isStaffRoutePath(normalizedPathname)) {
    return {
      area: normalizedPathname.startsWith("/admin") ? "admin" : "instructor",
      allowedRoles: [],
      knownRoute: false,
    };
  }

  return null;
}

export function canAccessStaffArea(role: string | null | undefined, area: StaffArea) {
  const normalizedRole = normalizeStaffRole(role);

  if (area === "instructor") {
    return normalizedRole === INSTRUCTOR || normalizedRole === ADMIN;
  }

  if (area === "admin") {
    return normalizedRole === ADMIN;
  }

  return false;
}

export function canAccessStaffRoute(role: string | null | undefined, pathname: string) {
  const normalizedRole = normalizeStaffRole(role);
  const requirement = getStaffRouteRequirement(pathname);

  if (!normalizedRole || !requirement) {
    return false;
  }

  return requirement.allowedRoles.includes(normalizedRole);
}
