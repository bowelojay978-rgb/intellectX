# Release Safety

- Use `git archive` when creating a clean source backup from a known commit.
- Never zip the working directory directly.
- Never include `.env.local`, `.vercel`, `.next`, `node_modules`, `test-results`, Android build outputs, APKs, AABs, or `tsconfig.tsbuildinfo` in release artifacts.
- Keep paid checkout disabled until real authentication, entitlements, and Paddle webhook verification exist.
- Never run `npm audit fix --force`.
- Use `npm ci` to recover dependencies from `package-lock.json`.
