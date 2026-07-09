# IntellectX Agent Workflows

These workflow files provide reusable, repository-specific instructions for AI coding agents and human reviewers.

Use the narrowest workflow that matches the task:

- `auth-review.md` — authentication, authorization, identity, account switching, migration, and trust-boundary review.
- `precommit-review.md` — final diff review before commit or PR approval.
- `deep-scan.md` — full architectural or feature-level repository investigation before major changes.
- `runtime-smoke.md` — browser lifecycle validation with evidence capture.

## Validation automation

Prefer the repository validation orchestrator instead of repeatedly typing long command chains:

- `npm run validate:quick` — typecheck + unit tests.
- `npm run validate:standard` — typecheck + lint + unit tests + build.
- `npm run validate:full` — standard validation + Playwright E2E.
- `npm run validate:convex` — Convex codegen + typecheck + lint + unit tests + build.

The orchestrator stops at the first failed step and returns that exit code.

## Operating rules

- Inspect before editing.
- Preserve unrelated work.
- Keep diffs minimal.
- Never enable payments unless explicitly authorized.
- Never trust client-provided identity, role, ownership, entitlement, or migration claims for protected actions.
- Do not claim validation passed unless it actually ran successfully.
- Report uncertainty and skipped checks explicitly.

## Recommended sequence for risky work

1. Run `deep-scan.md` on the affected feature or subsystem.
2. Implement the narrowest change possible.
3. Run the relevant targeted workflow, especially `auth-review.md` for identity or authorization changes.
4. Run `precommit-review.md` before commit or merge.
5. Run `runtime-smoke.md` for user-facing lifecycle changes.
