# IntellectX Deep Scan Workflow

Use this workflow before major architecture work, security-sensitive changes, cross-cutting refactors, or when the existing implementation is not fully understood.

## Goal

Build evidence-based understanding before editing. Do not infer architecture from file names alone.

## Required scan layers

### 1. Repository anatomy

Map:

- routes
- pages and layouts
- components
- hooks
- helpers and utilities
- Convex queries, mutations, actions, schema, tables, and indexes
- browser storage keys
- environment variables
- Clerk, Paddle, Capacitor, Playwright, Vitest, and deployment references
- scripts, tests, CI, TODOs, and apparently unused files

### 2. Dependency and call flow

Trace affected behavior through:

`route -> component -> hook -> helper -> Convex function -> database table/index -> auth decision`

Document hidden coupling and duplicate pathways.

### 3. Data lineage

For each affected domain object, document:

- source of truth
- local cache
- remote storage
- hydration
- writes
- migration
- clearing
- logout behavior
- account switching
- empty-state behavior

### 4. Runtime behavior

When runtime access exists, observe:

- URL transitions
- auth loaded/signed-in state
- user identity changes
- Convex requests and responses
- localStorage before and after actions
- console errors
- network failures
- hydration timing

Do not claim runtime behavior was verified if no browser run occurred.

### 5. Git archaeology

Inspect history to determine:

- when the architecture was introduced
- whether a current path is temporary or intentional
- abandoned approaches
- previous regressions and fixes
- migration bridges still present

### 6. Trust boundaries

For every protected operation, identify:

- user-controlled inputs
- client-controlled identity or role data
- server-verified identity
- ownership checks
- entitlement checks
- staff authorization
- migration ownership proof

### 7. Structural risk

Look for:

- dead code
- circular dependencies
- duplicate behavior
- multiple sources of truth
- stale fallback paths
- client/server contract drift
- untested critical flows
- silently swallowed errors

## Required output

Produce:

- files inspected
- architecture map
- route/data/call flow
- trust boundaries
- risks ranked by severity
- confirmed facts vs inference
- missing evidence
- exact recommended implementation order
- validation plan

## Stop rule

Do not start a major architectural edit until the affected subsystem is understood well enough to explain its current end-to-end behavior and trust model.
