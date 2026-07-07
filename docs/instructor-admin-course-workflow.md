# Instructor/Admin Course Publishing Workflow Design

## 1. Purpose

This document defines the future production workflow for courses created by instructors and approved by admins before learners can access them. Course publishing must be controlled by role-based workflow, not direct learner visibility.

Related references:
- [./production-readiness-tracker.md](./production-readiness-tracker.md)
- [./route-access-matrix.md](./route-access-matrix.md)
- [./production-smoke-test-checklist.md](./production-smoke-test-checklist.md)
- [./security-env-audit.md](./security-env-audit.md)

## 2. Roles

- Instructor: creates and edits courses, submits them for review, and manages course content before approval.
- Admin: reviews submitted courses, approves or requests changes, publishes or unpublishes approved courses, and manages instructor access.
- Learner: can view only courses that are both approved and published.

The frontend policy foundation for this workflow now lives in [src/lib/course-workflow-policy.ts](../src/lib/course-workflow-policy.ts). It defines the role constants, lifecycle/status constants, learner visibility rules, explicit transition checks, and small role-intent helpers for the future workflow. Current placeholder staff route access intent lives in [src/lib/staff-route-access-policy.ts](../src/lib/staff-route-access-policy.ts), and the current route guard fails closed at runtime unless trusted Clerk session claims resolve to an allowed staff role.

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

Locked placeholder routes now exist in the app router for these paths, but they are not real dashboards and are not production-ready. They expose no course-management actions. Real RBAC, server authorization, schema-backed workflow actions, and audit logging are still missing before these routes can become operational.

## 8. Future Convex/schema needs

The production workflow now has a narrow schema foundation for course metadata and workflow state. Existing learner-visible seed/static courses resolve to `approved` plus `published`, and learner-facing course reads filter through that state. Full production workflow support still requires server-authorized writes and audit logging.

Current narrow fields:

- Course owner or instructor ID.
- Approval status.
- Publication status.
- `submittedAt` timestamp.
- `reviewedAt` timestamp.
- `reviewedBy` identifier.
- Rejection or change-request reason.
- Audit log collection or table.

## 9. Audit log requirements

Audit logging must exist before real course operations are trusted. Required audit events include:

- Course submitted.
- Course approved.
- Changes requested.
- Course published.
- Course unpublished.
- Course archived.
- Instructor permission changed.

## 10. Production blockers

The following blockers must be resolved before this workflow is production-safe:

- Locked placeholder admin and instructor routes exist, but real dashboards and actions do not.
- Trusted staff role claims must be configured and validated in Clerk; current runtime protection denies access when those claims are missing.
- Admin and instructor actions must be server-authorized.
- Audit logging must exist before real course operations are trusted.

## 11. Implementation order

A safe implementation order is:

1. Design doc.
2. Locked placeholder routes.
3. Schema and status fields.
4. Learner visibility filtering.
5. Instructor draft creation.
6. Admin review queue.
7. Audit logging.
8. Production QA.
