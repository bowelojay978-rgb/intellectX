# Production Deployment Runbook

## 1. Purpose

This document defines the safe deployment process for IntellectX when moving toward production. It is a deployment process document, not proof that production is ready.

## 2. Required readiness documents

Before deployment, review and confirm the current status of the following documents:

- [./production-readiness-tracker.md](./production-readiness-tracker.md)
- [./production-smoke-test-checklist.md](./production-smoke-test-checklist.md)
- [./real-auth-activation.md](./real-auth-activation.md)
- [./route-access-matrix.md](./route-access-matrix.md)
- [./billing-entitlement-lifecycle.md](./billing-entitlement-lifecycle.md)
- [./webhook-replay-protection-design.md](./webhook-replay-protection-design.md)
- [./security-env-audit.md](./security-env-audit.md)

## 3. Pre-deployment checks

- [ ] The repository is clean enough for release and the working tree does not contain unintended edits.
- [ ] The deployment branch is synced with origin and the intended release commit is identified.
- [ ] Typecheck passes.
- [ ] Unit tests pass.
- [ ] Focused E2E checks pass.
- [ ] The production environment preflight check passes without printing secret values.
- [ ] Checkout and paid access remain disabled until auth and webhook verification are complete.

## 4. Auth deployment checks

- [ ] Clerk production environment keys are configured.
- [ ] CLERK_JWT_ISSUER_DOMAIN is configured.
- [ ] convex/auth.config.ts is added only after the issuer exists.
- [ ] Clerk to Convex identity is verified in the target environment.
- [ ] ctx.auth.getUserIdentity() is non-null for user-owned reads and writes.

## 5. Convex deployment checks

- [ ] The correct Convex production deployment is selected.
- [ ] Schema generation is complete.
- [ ] Functions are deployed to the intended environment.
- [ ] Production-like behavior does not allow local userKey fallback for protected access.

## 6. Billing deployment checks

- [ ] Checkout remains disabled until provider verification exists.
- [ ] Webhook signature verification is required before any billing event is accepted.
- [ ] Replay protection is required before any billing event can change entitlement state.
- [ ] Server-side entitlement writes are required for verified provider events.
- [ ] Checkout success redirect is not treated as entitlement proof.

## 7. Post-deployment smoke checks

- [ ] Public routes load correctly.
- [ ] Auth routes behave correctly for signed-in and signed-out users.
- [ ] Paid-content paths fail closed without an active entitlement.
- [ ] Mobile routes remain focused on free study tools.
- [ ] No secret values are exposed in logs or UI.

## 8. Rollback rules

Rollback immediately if any of the following occurs:

- [ ] Auth identity fails in the deployed environment.
- [ ] Protected routes leak data or allow access without trusted identity.
- [ ] Paid content unlocks without an active entitlement.
- [ ] Environment configuration or webhook verification is uncertain.

## 9. Final production decision

- [ ] Production auth checks passed.
- [ ] Production entitlement checks passed.
- [ ] Production billing and webhook checks passed.
- [ ] Production deployment smoke checks passed.

Production readiness remains blocked if any critical auth, entitlement, billing, or deployment smoke check fails.
