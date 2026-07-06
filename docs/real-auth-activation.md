# Real Auth Activation

This checklist is developer-facing and must be completed before IntellectX treats Clerk and Convex auth as production-ready. Do not commit secret values or screenshots containing secret values.

## Current Modes

- `local-fallback`: no Clerk publishable key and no Convex URL. Browser-backed learner sessions guard app routes.
- `clerk-only`: Clerk publishable key exists, Convex URL is missing. Clerk handles signed-in state, but Convex migration and account-backed persistence do not run.
- `convex-only`: Convex URL exists, Clerk publishable key is missing. Local fallback remains active while Convex sync can use browser-derived local learner keys.
- `clerk-convex-ready`: Clerk publishable key and Convex URL exist. Clerk handles signed-in state, frontend Convex sync can run without a local browser learner session, and the local-to-auth migration bridge can run when a local source key exists. Convex identity is fully secure only after `convex/auth.config.ts` is added with the configured issuer.

## Activation Order

1. Configure the Clerk app.
2. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
3. Add `CLERK_SECRET_KEY` only where needed server-side.
4. Configure the Convex auth issuer.
5. Set `CLERK_JWT_ISSUER_DOMAIN`.
6. Only then add `convex/auth.config.ts`.
7. Run `npx convex codegen`, `npm run typecheck`, `npm run test:unit`, the focused auth E2E smoke tests, and `npm run build`.
8. QA login, signup, route guards, Convex identity, and local-to-auth data migration.

## Safety Notes

- Local fallback remains active when Clerk env is missing.
- Clerk mode without Convex URL must not attempt local-to-auth Convex migration.
- Convex URL without Clerk is not real auth; it is local fallback with Convex sync.
- Clerk+Convex frontend sync still passes a `userKey` argument because the existing Convex function signatures require it. If no local learner key exists, the client uses an authenticated-user placeholder; production security depends on Convex authenticated identity overriding that placeholder server-side.
- Local-to-auth auto-migration only uses the current browser's local learner session key, records a local attempted/succeeded marker, and rejects authenticated, placeholder, or malformed source keys during migration planning.
- Do not treat the placeholder path as paid-production safe. Remove or restrict fallback `userKey` trust before enabling paid access.
- Payments remain blocked until real auth, secure entitlements, checkout verification, webhook verification, and subscription lifecycle handling are complete.
