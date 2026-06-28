# Release Safety

- Use `git archive` when creating a clean source backup from a known commit.
- Never zip the working directory directly.
- Never include `.env.local`, `.vercel`, `.next`, `android/app/build`, `android/local.properties`, `test-results`, or `tsconfig.tsbuildinfo` in release artifacts.
- Never run `npm audit fix --force`.
- Use `npm ci` to recover dependencies from `package-lock.json`.
