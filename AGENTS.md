# IntellectX Repository Agent Rules

These rules apply to AI coding agents and automated contributors working in this repository.

## Core workflow

- Inspect relevant files and existing architecture before editing.
- Keep changes narrowly scoped to the requested task.
- Preserve unrelated work and avoid opportunistic rewrites, renames, or moves.
- Prefer minimal diffs over broad refactors.
- Do not claim a browser flow, test, build, or validation passed unless it was actually executed successfully.
- Never hide failed validation. Report failures and remaining uncertainty explicitly.

## Protected areas

- Do not enable payments or payment processing unless explicitly authorized.
- Do not expose, hardcode, log, or commit secrets, API keys, tokens, or production credentials.
- Do not trust client-provided roles, identities, ownership claims, entitlements, or migration ownership.
- Clerk server-authenticated identity and Convex server-side authorization are authoritative for protected actions.
- Staff access must fail closed when trusted role claims are absent or invalid.
- Preserve the existing UI unless the task explicitly requests visual changes.

## Git safety

- Do not commit, push, merge, or deploy unless explicitly authorized for that workflow.
- Prefer a dedicated branch and pull request for repository-level automation or high-risk changes.
- Never overwrite unrelated dirty work.

## Validation

Run the smallest relevant validation first, then broader checks when appropriate:

- `npm run typecheck`
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run test:e2e`
- `npm run convex:codegen` when Convex schema or functions change

Before completion, report:

- files changed
- validations run and their results
- risks, assumptions, or skipped checks
- whether the change was committed, pushed, merged, or left uncommitted
