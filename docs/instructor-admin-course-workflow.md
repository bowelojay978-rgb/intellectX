# Instructor/Admin Course Publishing Workflow Design

## 1. Purpose

This document defines the production workflow foundation for courses created by instructors and approved by admins before learners can access them. Course publishing must be controlled by role-based workflow, not direct learner visibility.

Related references:
- [./production-readiness-tracker.md](./production-readiness-tracker.md)
- [./route-access-matrix.md](./route-access-matrix.md)
- [./production-smoke-test-checklist.md](./production-smoke-test-checklist.md)
- [./security-env-audit.md](./security-env-audit.md)

## 2. Roles

- Instructor: creates and edits courses, submits them for review, and manages course content before approval.
- Admin: reviews submitted courses, approves or requests changes, publishes or unpublishes approved courses, and manages instructor access.
- Learner: can view only courses that are both approved and published.

The frontend policy foundation for this workflow lives in [src/lib/course-workflow-policy.ts](../src/lib/course-workflow-policy.ts). Runtime Convex authorization lives in [convex/lib/staffRbac.ts](../convex/lib/staffRbac.ts), and workflow transition/audit helpers live in [convex/lib/courseWorkflowMutations.ts](../convex/lib/courseWorkflowMutations.ts). Current placeholder staff route access intent lives in [src/lib/staff-route-access-policy.ts](../src/lib/staff-route-access-policy.ts), and the current route guard fails closed at runtime unless trusted Clerk session claims resolve to an allowed staff role.

Convex course workflow mutations now exist in [convex/courses.ts](../convex/courses.ts). They fail closed without trusted staff role claims in the Convex identity.

## 3. Course lifecycle statuses

The course lifecycle should use the following statuses:

- `draft`
- `submitted_for_review`
- `changes_requested`
- `approved`
- `published`
- `unpublished`
- `archived`

## 4. Instructor permissions

Instructors should be able to:

- Create draft courses.
- Edit their own draft and courses with requested changes.
- Add lessons, quizzes, and resources to their own course drafts.
- Submit a course for admin review.
- View the current review status of their own courses.
- Cannot approve their own course.
- Cannot publish directly to learners unless an admin-approved policy explicitly allows that later.

## 5. Admin permissions

Admins should be able to:

- View submitted courses.
- Approve courses.
- Request changes with a reason.
- Publish and unpublish approved courses.
- Archive unsafe or outdated courses.
- Manage instructor access.
- View audit history for course lifecycle actions.

## 6. Learner visibility rules

Learner visibility must be intentionally restricted:

- Learners only see courses that are both `approved` and `published`.
- Draft courses must never leak to learners.
- Submitted, changes-requested, unpublished, and archived courses must fail closed.
- Direct URLs must not bypass visibility rules.

## 7. Route plan

Future routes should be role-protected and separate by function:

- Future `/instructor` dashboard.
- Future `/instructor/courses`.
- Future `/instructor/courses/new`.
- Future `/admin` dashboard.
- Future `/admin/course-review`.
- Future `/admin/instructors`.

Locked placeholder routes now exist in the app router for these paths, but they are not real dashboards and are not production-ready. They expose no course-management actions. Server-authorized Convex workflow mutations now exist, but the dashboards still need real UI integration, Clerk role claim configuration, and production QA before these routes can become operational.

## 8. Future Convex/schema needs

The production workflow now has a narrow schema foundation for course metadata, workflow state, and audit logging. Existing learner-visible seed/static courses resolve to `approved` plus `published`, and learner-facing course reads filter through that state.

Current narrow fields:

- Course owner or instructor ID.
- Approval status.
- Publication status.
- `submittedAt` timestamp.
- `reviewedAt` timestamp.
- `reviewedBy` identifier.
- Rejection or change-request reason.
- Append-only audit log table.

## 9. Audit log requirements

Audit logging foundation exists in the `auditLogs` table. Course workflow mutations append audit events for:

- Course submitted.
- Course approved.
- Changes requested.
- Course published.
- Course unpublished.
- Course archived.
- Instructor permission changed is still future work.

## 10. Production blockers

The following blockers must be resolved before this workflow is production-safe:

- Locked placeholder admin and instructor routes exist, but real dashboards do not.
- Trusted staff role claims must be configured and validated in Clerk and propagated to Convex identity; current runtime protection denies access when those claims are missing.
- Production QA must prove the Clerk JWT template exposes a trusted role claim at `staff.role`, `metadata.role`, `publicMetadata.role`, or `appMetadata.role` with only `learner`, `instructor`, or `admin`.

## 11. Implementation order

A safe implementation order is:

1. Design doc.
2. Locked placeholder routes.
3. Schema and status fields.
4. Learner visibility filtering.
5. Instructor draft creation.
6. Admin review queue.
7. Audit logging.
8. Dashboard UI integration.
9. Production QA.
