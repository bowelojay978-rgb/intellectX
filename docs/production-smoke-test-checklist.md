# Production Deployment Smoke-Test Checklist

This checklist is for real deployment validation only. It is not a local demo checklist and it is not a substitute for production auth, entitlement, or webhook verification.

Related references:
- [./production-readiness-tracker.md](./production-readiness-tracker.md)
- [./real-auth-activation.md](./real-auth-activation.md)
- [./route-access-matrix.md](./route-access-matrix.md)
- [./billing-entitlement-lifecycle.md](./billing-entitlement-lifecycle.md)
- [./security-env-audit.md](./security-env-audit.md)

## 1. Purpose

Use this checklist before treating IntellectX as production-ready. The goal is to verify the deployed environment behaves correctly for real users, not merely in local development.

## 2. Pre-smoke requirements

- [ ] Clerk production environment keys are configured.
- [ ] CLERK_JWT_ISSUER_DOMAIN is configured.
- [ ] convex/auth.config.ts is added only after the issuer exists and is validated.
- [ ] The intended Convex production deployment is selected.
- [ ] Checkout and paid access remain disabled until webhook verification is complete.
- [ ] ALLOW_LOCAL_USERKEY_FALLBACK is unset or false.

## 3. Public route smoke checks

- [ ] Home page loads successfully.
- [ ] Pricing page loads but cannot grant paid access.
- [ ] Login and signup routes load successfully.
- [ ] No protected learner data appears while signed out.

## 4. Authenticated route smoke checks

- [ ] A signed-in user can reach the dashboard.
- [ ] Protected routes reject signed-out users.
- [ ] The Clerk session is active for the signed-in user.
- [ ] Convex calls use the authenticated identity.
- [ ] ctx.auth.getUserIdentity() is non-null for user-owned reads and writes.

## 5. Entitlement and paid-content checks

- [ ] Paid lessons and quizzes fail closed without an active entitlement.
- [ ] Checkout success redirect is not treated as entitlement proof.
- [ ] Only a server-side active entitlement unlocks paid access.
- [ ] Expired, cancelled, refunded, and payment_failed states remain blocked.

## 6. Billing and webhook checks

- [ ] The provider webhook endpoint is reachable.
- [ ] Signature verification is enforced.
- [ ] Replay protection works.
- [ ] A verified provider event writes entitlement status server-side.
- [ ] Unknown or malformed events fail closed.

## 7. Mobile scope checks

- [ ] Mobile routes stay focused on free study tools.
- [ ] Mobile routes do not expose checkout.
- [ ] Mobile routes do not imply paid access.

## 8. Final production decision

- [ ] Production auth checks passed.
- [ ] Production entitlement checks passed.
- [ ] Production webhook checks passed.
- [ ] Production deployment smoke checks passed.

Production readiness remains blocked if any critical auth, entitlement, webhook, or deployment smoke check fails.
