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

## TGC Alignment

This document supports the security/env audit TGC item. Related automated coverage checks the configured low-risk security headers, while secret review remains a manual checklist item.
