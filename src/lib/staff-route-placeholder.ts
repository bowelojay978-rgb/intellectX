export type StaffPlaceholderRouteKey =
  | "admin"
  | "admin-course-review"
  | "admin-instructors"
  | "instructor"
  | "instructor-courses"
  | "instructor-courses-new";

type StaffPlaceholderMetadata = {
  roleLabel: string;
  heading: string;
  summary: string;
  detail: string;
  docs: string[];
};

export function getStaffPlaceholderMetadata(route: StaffPlaceholderRouteKey): StaffPlaceholderMetadata {
  switch (route) {
    case "admin":
      return {
        roleLabel: "Admin-only access",
        heading: "Admin workspace is not available yet",
        summary:
          "This placeholder route is intentionally locked until production RBAC, server authorization, and audit logging are implemented.",
        detail:
          "Admin-only review and instructor management will be added later after real auth and server authorization are in place.",
        docs: [
          "production-readiness-tracker.md",
          "route-access-matrix.md",
          "production-smoke-test-checklist.md",
          "security-env-audit.md",
        ],
      };
    case "admin-course-review":
      return {
        roleLabel: "Admin-only access",
        heading: "Course review is not available yet",
        summary:
          "Course review and approval are not available in this build. The workflow remains blocked until production RBAC and server authorization are implemented.",
        detail:
          "Learner visibility will remain limited to approved and published courses once the workflow is implemented.",
        docs: [
          "instructor-admin-course-workflow.md",
          "production-readiness-tracker.md",
          "route-access-matrix.md",
        ],
      };
    case "admin-instructors":
      return {
        roleLabel: "Admin-only access",
        heading: "Instructor management is not available yet",
        summary:
          "This placeholder route is intentionally locked until production RBAC, server authorization, and audit logging are implemented.",
        detail:
          "Instructor access changes will be handled by server-authorized admin actions once the workflow is implemented.",
        docs: [
          "instructor-admin-course-workflow.md",
          "production-readiness-tracker.md",
          "security-env-audit.md",
        ],
      };
    case "instructor":
      return {
        roleLabel: "Instructor-only access",
        heading: "Instructor workspace is not available yet",
        summary:
          "This placeholder route is intentionally locked until production RBAC, server authorization, and audit logging are implemented.",
        detail:
          "Instructor course drafting and review workflows will be added later after real auth and server authorization are in place.",
        docs: [
          "instructor-admin-course-workflow.md",
          "production-readiness-tracker.md",
          "route-access-matrix.md",
        ],
      };
    case "instructor-courses":
      return {
        roleLabel: "Instructor-only access",
        heading: "Instructor course list is not available yet",
        summary:
          "Course management is not available in this build. Draft and review actions remain blocked until production RBAC and server authorization are implemented.",
        detail:
          "Learners will continue to see only approved and published courses until the workflow is fully implemented.",
        docs: [
          "instructor-admin-course-workflow.md",
          "route-access-matrix.md",
          "production-smoke-test-checklist.md",
        ],
      };
    case "instructor-courses-new":
      return {
        roleLabel: "Instructor-only access",
        heading: "Course creation is not available yet",
        summary:
          "This placeholder route is intentionally locked until production RBAC, server authorization, and audit logging are implemented.",
        detail:
          "Course creation and submission to review will be added later as a server-authorized workflow.",
        docs: [
          "instructor-admin-course-workflow.md",
          "production-readiness-tracker.md",
          "route-access-matrix.md",
        ],
      };
  }
}
