# Real Auth Activation

This checklist is developer-facing and must be completed before IntellectX treats Clerk and Convex auth as production-ready. Do not commit secret values or screenshots containing secret values.

## Current Modes

- `local-fallback`: no Clerk publishable key and no Convex URL. Browser-backed learner sessions guard app routes.
- `clerk-only`: Clerk publishable key exists, Convex URL is missing. Clerk handles signed-in state, but Convex migration and account-backed persistence do not run.
- `convex-only`: Convex URL exists, Clerk publishable key is missing. Local fallback remains active while Convex sync can use browser-derived local learner keys.
- `clerk-convex-ready`: Clerk publishable key and Convex URL exist. Clerk handles signed-in state, frontend Convex sync can run without a local browser learner session, and the local-to-auth migration bridge can run when a local source key exists. The source auth config already exists at `convex/auth.config.ts`; production trust still requires `CLERK_JWT_ISSUER_DOMAIN` to be configured in the intended Convex environment, that auth config to be deployed there, and real runtime QA proving authenticated Convex identity resolves correctly.

The first three modes are development/test compatibility modes only. A production build accepts only `clerk-convex-ready`; `npm run build` runs the strict production auth preflight and fails when required Clerk/Convex values are missing or local identity fallback is enabled.

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

## Backend Auth Completion Controls

The backend authentication lane now requires all of the following source controls:

- authenticated Convex identity always overrides client-supplied `userKey`;
- browser-supplied local `userKey` fallback is denied by default in production-like environments;
- `ALLOW_LOCAL_USERKEY_FALLBACK` is normalized with trimming and case-insensitive parsing before policy decisions;
- `convex/auth.config.ts` fails clearly when `CLERK_JWT_ISSUER_DOMAIN` is missing, malformed, or not HTTPS;
- the Convex Clerk audience remains `applicationID: "convex"`;
- every learner-owned Convex module routes identity through `resolveLearnerUserKey`;
- account migration requires authenticated email ownership and fails closed on mismatches;
- `convex/authDiagnostics.ts` exposes only boolean runtime proof fields and never returns raw identity claims.

## FF-011 Coordination Boundary

Frontend owns FF-011 reproduction and classification across:

- normal browser window;
- incognito;
- fresh browser profile;
- localhost;
- hosted HTTPS production link.

Frontend must prove whether the mixed login/logged-in homepage state comes from presentation state, Clerk session state, cookies/origin, hydration, caching, or environment configuration before editing authentication behavior.

Backend must not change homepage presentation, loading UI, or Clerk card behavior while FF-011 is under frontend diagnosis. Backend owns only Clerk -> Convex identity trust, JWT issuer configuration, protected Convex reads/writes, account isolation, migration ownership, and fail-closed behavior.

## Runtime Auth Proof Protocol

For each FF-011 test environment, collect these backend auth facts alongside frontend observations:

1. Clerk runtime reaches a loaded state.
2. Signed-out state produces no authenticated Convex identity.
3. Signed-in state makes `authDiagnostics:getAuthRuntimeDiagnostic` report `authenticated: true`, with token identifier, subject, and issuer presence all true.
4. A signed-in learner-owned Convex read succeeds without a browser-supplied `userKey`.
5. A signed-in learner-owned Convex write succeeds without a browser-supplied `userKey`.
6. A forged browser `userKey` cannot override the authenticated Convex identity.
7. After sign-out, protected learner writes fail closed in production-like configuration.
8. Account switching does not hydrate another learner's local migration source.

This protocol separates a frontend mixed-state defect from a real Clerk/Convex identity failure. A homepage presentation mismatch is not, by itself, evidence that Convex authentication failed.

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

Staff authorization is evaluated from the currently validated Convex JWT on every privileged request. Role revocation therefore takes effect no later than expiry and refresh of the previously issued `convex` JWT. The operational token lifetime is the Clerk JWT template's `Token lifetime` (`exp - iat`); record that configured value in the production runbook and test revocation within that exact window before release. Convex pauses authenticated calls while `ConvexProviderWithClerk` refreshes the token, and an expired or otherwise invalid token produces no authenticated identity.

## Safety Notes

- Local fallback remains available only in non-production development/test when `ALLOW_LOCAL_USERKEY_FALLBACK=true` is explicitly configured.
- Route access, protected data surfaces, and payment-sensitive paths are tracked in `docs/route-access-matrix.md`.
- Clerk mode without Convex URL must not attempt local-to-auth Convex migration.
- Convex URL without Clerk is not real auth; it is local fallback with Convex sync.
- Clerk+Convex frontend sync can call user-owned Convex profile, course-selection, quiz, lesson-progress, and study-activity functions without a local browser learner session. In that mode the client omits `userKey`; production security still depends on Convex authenticated identity resolving server-side.
- Local/Convex-only fallback still passes a browser-derived `learner:<email>` key for development/free fallback mode only.
- Local-to-auth auto-migration only uses the current browser's local learner session key, records a local attempted/succeeded marker, and rejects authenticated, placeholder, or malformed source keys during migration planning.
- Authenticated Convex identity is the production source of truth for user-owned data. In production-like environments, user-owned Convex functions fail closed when `ctx.auth.getUserIdentity()` is missing.
- Staff workflow mutations use only Convex `ctx.auth.getUserIdentity()` and trusted role claims. Missing role claims fail closed.
- `ALLOW_LOCAL_USERKEY_FALLBACK=true` is for local/development compatibility only. Production rejects it at preflight and runtime, so browser-supplied `userKey` values cannot read or write protected user data.
- The old authenticated placeholder key remains only as a migration rejection sentinel; it is not used for normal Clerk+Convex learner sync.
- Paid access requires server-side entitlements. Only `active` entitlement status unlocks paid content; `none`, `expired`, `cancelled`, `refunded`, and `payment_failed` remain blocked.
- Billing lifecycle mapping is documented in `docs/billing-entitlement-lifecycle.md`; only verified server/provider events may write entitlements.
- Checkout success redirects are not proof of entitlement.
- Payments remain blocked until real authentication, secure entitlements, checkout verification, webhook verification, and subscription lifecycle handling are complete.
