# Real Auth Activation

This checklist is developer-facing and must be completed before IntellectX treats Clerk and Convex auth as production-ready. Do not commit secret values or screenshots containing secret values.

## Current Modes

- `local-fallback`: no Clerk publishable key and no Convex URL. Browser-backed learner sessions guard app routes.
- `clerk-only`: Clerk publishable key exists, Convex URL is missing. Clerk handles signed-in state, but Convex migration and account-backed persistence do not run.
- `convex-only`: Convex URL exists, Clerk publishable key is missing. Local fallback remains active while Convex sync can use browser-derived local learner keys.
- `clerk-convex-ready`: Clerk publishable key and Convex URL exist. Clerk handles signed-in state, frontend Convex sync can run without a local browser learner session, and the local-to-auth migration bridge can run when a local source key exists. The source auth config already exists at `convex/auth.config.ts`; production trust still requires `CLERK_JWT_ISSUER_DOMAIN` to be configured in the intended Convex environment, that auth config to be deployed there, and real runtime QA proving authenticated Convex identity resolves correctly.

## Activation Order

1. Configure the Clerk app.
2. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
3. Add `CLERK_SECRET_KEY` only where needed server-side.
4. Activate Clerk's Convex integration and copy the Clerk Frontend API URL.
5. Set `CLERK_JWT_ISSUER_DOMAIN` in the Convex environment to that Clerk Frontend API URL.
6. Deploy the existing `convex/auth.config.ts` using `CLERK_JWT_ISSUER_DOMAIN` and `applicationID: "convex"` to the intended Convex environment.
7. Run `npx convex codegen`, `npm run typecheck`, `npm run test:unit`, the focused auth E2E smoke tests, and `npm run build`.
8. QA login, signup, route guards, Convex identity, and local-to-auth data migration.

## Missing Env Gate

Do not deploy `convex/auth.config.ts` to an environment until these values are present in the correct places:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY` where server-side Clerk access is required
- `NEXT_PUBLIC_CONVEX_URL`
- `CLERK_JWT_ISSUER_DOMAIN`

Get `CLERK_JWT_ISSUER_DOMAIN` from the Clerk Dashboard after activating the Convex integration. Use the Clerk app's Frontend API URL: development values usually look like `https://verb-noun-00.clerk.accounts.dev`, while production values usually use the custom Clerk domain. Set it in the Convex dashboard or with Convex env tooling; do not hardcode it into source.

The browser-facing auth environment helper can detect Clerk and Convex public configuration, but it cannot prove server-side issuer configuration or whether Convex auth config has been deployed to the intended environment. Real authentication is only proven when a signed-in Clerk user can load a protected route, frontend Convex calls are sent through `ConvexProviderWithClerk`, and `ctx.auth.getUserIdentity()` returns a non-null identity for user-owned Convex reads and writes.

## Staff role claim setup

Staff route guards and Convex staff workflow mutations accept only these role values:

- `learner`
- `instructor`
- `admin`

Configure one trusted Clerk JWT claim path for staff role propagation:

- `staff.role`
- `metadata.role`
- `publicMetadata.role`
- `appMetadata.role`

Do not use unsafe metadata, query params, browser storage, emails, or client-passed roles. The Clerk JWT template used by `ConvexProviderWithClerk` must be named `convex`; the template must preserve the default Convex audience and include the chosen staff role claim.

## Safety Notes

- Local fallback remains active when Clerk env is missing.
- Route access, protected data surfaces, and payment-sensitive paths are tracked in `docs/route-access-matrix.md`.
- Clerk mode without Convex URL must not attempt local-to-auth Convex migration.
- Convex URL without Clerk is not real auth; it is local fallback with Convex sync.
- Clerk+Convex frontend sync can call user-owned Convex profile, course-selection, quiz, lesson-progress, and study-activity functions without a local browser learner session. In that mode the client omits `userKey`; production security still depends on Convex authenticated identity resolving server-side.
- Local/Convex-only fallback still passes a browser-derived `learner:<email>` key for development/free fallback mode only.
- Local-to-auth auto-migration only uses the current browser's local learner session key, records a local attempted/succeeded marker, and rejects authenticated, placeholder, or malformed source keys during migration planning.
- Authenticated Convex identity is the production source of truth for user-owned data. In production-like environments, user-owned Convex functions fail closed when `ctx.auth.getUserIdentity()` is missing.
- Staff workflow mutations use only Convex `ctx.auth.getUserIdentity()` and trusted role claims. Missing role claims fail closed.
- `ALLOW_LOCAL_USERKEY_FALLBACK=true` is for local/development compatibility only. Keep it unset or `false` in production so browser-supplied `userKey` values cannot read or write protected user data.
- The old authenticated placeholder key remains only as a migration rejection sentinel; it is not used for normal Clerk+Convex learner sync.
- Paid access requires server-side entitlements. Only `active` entitlement status unlocks paid content; `none`, `expired`, `cancelled`, `refunded`, and `payment_failed` remain blocked.
- Billing lifecycle mapping is documented in `docs/billing-entitlement-lifecycle.md`; only verified server/provider events may write entitlements.
- Checkout success redirects are not proof of entitlement.
- Payments remain blocked until real authentication, secure entitlements, checkout verification, webhook verification, and subscription lifecycle handling are complete.
