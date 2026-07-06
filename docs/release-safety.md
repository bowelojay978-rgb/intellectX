# Release Safety

- Use `git archive` when creating a clean source backup from a known commit.
- Never zip the working directory directly.
- Never include `.env.local`, `.vercel`, `.next`, `node_modules`, `test-results`, Android build outputs, APKs, AABs, or `tsconfig.tsbuildinfo` in release artifacts.
- Keep paid checkout disabled until real authentication, entitlements, and Paddle webhook verification exist.
- Keep paid content blocked unless a server-side entitlement has active status.
- Never grant paid access from client-only flags, localStorage, pricing cards, or checkout query params.
- Never run `npm audit fix --force`.
- Use `npm ci` to recover dependencies from `package-lock.json`.
