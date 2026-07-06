# Security and Environment Audit

Use this checklist before sharing builds, deploying releases, or handing artifacts to another environment. Do not print or copy secret values into docs, tickets, screenshots, or chat.

## Vercel Env Var Review

- [ ] Confirm required public variables are intentionally public and prefixed only when safe.
- [ ] Confirm secret variables are stored as server-side environment variables.
- [ ] Confirm development, preview, and production environments do not accidentally share unsafe values.
- [ ] Rotate any key that may have been exposed.
- [ ] Review deployment logs for accidental secret output.

## Convex Permissions Review

- [ ] Confirm Convex deployment points to the intended project.
- [ ] Confirm read/write functions expose only the intended data.
- [ ] Confirm seed data is safe for the intended release audience.
- [ ] Confirm catalog seeding remains internal/developer-only and is not exposed to client runtime.
- [ ] Confirm generated Convex files are not manually edited.
- [ ] Confirm production data access is reviewed before launch.

## Auth Readiness

- [ ] Clerk package/provider preparation exists.
- [ ] Clerk auth UI bridge exists.
- [ ] Clerk-aware nav, session, and profile UI exists.
- [ ] Dual-mode route guard exists for protected app routes.
- [ ] Local browser-backed learner sessions remain active when Clerk environment keys are missing.
- [ ] Convex learner identity resolution is centralized for user-owned data.
- [ ] Authenticated Clerk/Convex identity is preferred when available.
- [ ] Production Convex user-owned reads and writes fail closed without authenticated identity.
- [ ] `ALLOW_LOCAL_USERKEY_FALLBACK` is unset or `false` in production; use it only for local/development fallback testing.
- [ ] Frontend Convex sync is auth-aware: Clerk+Convex mode can hydrate and write account-backed profile, course selection, quiz, lesson progress, and study activity data without requiring a local browser learner session.
- [ ] Local-to-auth learner data migration bridge exists for account activation.
- [ ] Migration only runs when authenticated Convex identity exists; automatic frontend migration uses only the current browser's local learner identity as the source key.
- [ ] Local-to-auth migration records a local attempted/succeeded marker per auth mode and source key so failed auto-migration does not retry or log forever.
- [ ] Convex migration planning rejects empty, authenticated, placeholder, and malformed local source keys.
- [ ] Auth environment mode detection is documented in `docs/real-auth-activation.md`.
- [ ] Existing Convex calls still pass a `userKey` argument for compatibility. In Clerk+Convex mode without a local key, the frontend passes a placeholder that must be ignored by authenticated Convex identity once `convex/auth.config.ts` is active.
- [ ] Client-supplied `userKey` remains only as a temporary local/development fallback and is not production-trusted.
- [ ] Do not commit `convex/auth.config.ts` until `CLERK_JWT_ISSUER_DOMAIN` is set in the Convex dashboard.
- [ ] Full production Convex identity security still requires `convex/auth.config.ts` after `CLERK_JWT_ISSUER_DOMAIN` is configured.
- [ ] Keep payments blocked until real auth, secure entitlements, checkout verification, webhook verification, and subscription lifecycle are complete.
- [ ] Keep paid access blocked until fallback `userKey` trust is removed or restricted away from paid paths.
- [ ] Paid content fails closed unless a server-side entitlement has `active` status and an unexpired access period.
- [ ] Entitlement statuses are `none`, `active`, `expired`, `cancelled`, `refunded`, and `payment_failed`; only `active` unlocks paid access.

## Secrets Hygiene

- [ ] Do not commit `.env.local`.
- [ ] Do not paste secret values into support threads, docs, screenshots, or issue comments.
- [ ] Keep third-party payment keys server-side only when real payments are added.
- [ ] Keep AI provider keys server-side only when AI features are added.
- [ ] Use separate keys for development, preview, and production where possible.

## Clean Source Archive

- [ ] Prefer `git archive` from a known commit for source backups.
- [ ] Never zip the working directory directly.
- [ ] Do not include `.env.local`, `.vercel`, `.next`, `node_modules`, `test-results`, Android build outputs, APKs, AABs, or `tsconfig.tsbuildinfo`.
- [ ] Do not include generated local logs or temporary test artifacts.

## Dependency Recovery

- [ ] Use `npm ci` to recover dependencies from `package-lock.json`.
- [ ] Do not use pnpm or corepack for this project.
- [ ] Never run `npm audit fix --force`.
- [ ] Do not run `npm audit fix` as part of release prep without a focused review.

## Headers and CSP

- [ ] Verify `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` on a deployed route.
- [ ] CSP is currently deferred until production script, font, image, Vercel, and Convex origins can be verified together.
- [ ] Add CSP only after confirming it does not break Next.js, Vercel, Convex, fonts, images, or scripts.

## Paid Checkout Safety

- [ ] Keep paid checkout disabled until real authentication, entitlements, and Paddle webhook verification exist.
- [ ] Do not enable Paddle from a client-only checkout path.
- [ ] Do not claim paid production readiness until server-side authorization protects learner and entitlement data.
- [ ] Do not grant paid access from frontend flags, localStorage, pricing cards, or checkout query params.
- [ ] Subscription lifecycle and refund/payment-failure updates must write server-authorized entitlement status before any paid content is exposed.

## TGC Alignment

This document supports the security/env audit TGC item. Related automated coverage checks the configured low-risk security headers, while secret review remains a manual checklist item.
