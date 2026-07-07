# Production Readiness Tracker

This document tracks true production blockers only. It does not frame the product as MVP-ready or free-launch-ready; it focuses on the conditions that must be satisfied before IntellectX can be treated as production-ready.

Related references:
- [docs/real-auth-activation.md](./real-auth-activation.md)
- [docs/security-env-audit.md](./security-env-audit.md)
- [docs/route-access-matrix.md](./route-access-matrix.md)
- [docs/billing-entitlement-lifecycle.md](./billing-entitlement-lifecycle.md)

## 1. Current production readiness estimate

- Status: Not production-ready.
- Current posture: Auth and entitlement foundations exist, but production-grade auth, billing verification, and deployment validation remain incomplete.
- Production decision: Do not treat this build as production-ready until the blockers below are cleared and re-validated.

## 2. Completed production hardening

The following hardening work is in place and should be considered completed foundation work, not a production release signal by itself:

- Fail-closed Convex identity policy for user-owned data paths.
- Entitlement access foundation for paid-content gating.
- Billing entitlement lifecycle foundation for future verified provider events.
- Route and data access matrix documenting auth and access boundaries.
- Mobile scope locked away from paid flows so mobile entry points do not imply paid access.
- Placeholder admin and instructor routes exist as locked, non-production-ready surfaces until real RBAC, server authorization, and audit logging are implemented.
- A small frontend course workflow policy foundation is now in place for future instructor/admin course review and learner visibility decisions, but it does not replace server authorization, schema, or audit logging.

## 3. Remaining critical blockers

These items are still blocking production readiness:

- Clerk environment keys are not yet fully validated in the intended production environments.
- CLERK_JWT_ISSUER_DOMAIN is still required before production identity can be trusted.
- The production Clerk-to-Convex auth configuration in convex/auth.config.ts must be added and validated only after the issuer domain is configured.
- Real Clerk to Convex identity QA must be completed with an authenticated user path that proves protected routes and user-owned Convex reads/writes are resolved through trusted identity.
- A verified webhook endpoint must exist and be reachable from the provider.
- Webhook signature verification must be implemented and enforced before any billing event is accepted.
- Replay protection must be implemented so duplicate or stale webhook events cannot rewrite entitlements incorrectly.
- Server entitlement writes from real provider events must be proven end to end.
- Subscription lifecycle QA must be completed for renewal, cancellation, expiry, refund, and payment failure scenarios.
- A production deployment smoke pass must be completed against the real deployment environment.
- Admin and instructor workflow placeholders must remain locked until server-authorized RBAC, learner visibility filtering, and audit logging are implemented.
- Real course workflow enforcement still requires server-side authorization, schema-backed state, and audit logging beyond the new frontend policy helper.

## 4. What must stay disabled

The following must remain disabled until the blockers above are resolved:

- Checkout
- Paid access
- ALLOW_LOCAL_USERKEY_FALLBACK in production

These controls must not be enabled as a shortcut around auth, webhook verification, or entitlements.

## 5. Not production-ready until

- [ ] Clerk env keys are configured and verified in the target production environment.
- [ ] CLERK_JWT_ISSUER_DOMAIN is configured in the Convex environment.
- [ ] The production Clerk-to-Convex auth configuration is present and validated.
- [ ] Real Clerk to Convex identity QA passes for authenticated access and protected data paths.
- [ ] The webhook endpoint is verified and reachable.
- [ ] Webhook signature verification is enforced.
- [ ] Replay protection is implemented and tested.
- [ ] Server-side entitlement writes are proven from real provider events.
- [ ] Subscription lifecycle QA passes for active, cancelled, expired, refunded, and payment-failed states.
- [ ] A production deployment smoke pass succeeds without bypassing guardrails.
- [ ] Checkout and paid access remain disabled until the above checks are complete.
