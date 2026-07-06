# Production Route Access Matrix

This matrix documents the intended production access posture for IntellectX routes and user-owned data paths. It is a security reference, not a product roadmap. Do not weaken these requirements to make checkout, paid content, or local fallback easier to present.

## App Routes

| Route | Status | Data accessed | Auth requirement | Production concern | Test coverage |
| --- | --- | --- | --- | --- | --- |
| `/` | Public | Marketing/static content | None | Public CTA links must not unlock paid access. | Core route smoke, mobile smoke |
| `/login` | Public auth | Clerk UI when configured, local learner fallback when not | None to view; creates local session only in fallback mode | Login must not force study profile setup or create unrelated local data. | `login does not force study profile setup` |
| `/signup` | Public auth | Clerk UI when configured, local learner fallback when not | None to view | Signup bridge must not bypass route guards. | Core route smoke |
| `/forgot-password` | Public auth | Local auth bridge navigation only | None | Must not create a learner session. | `forgot password returns to login without creating a learner session` |
| `/pricing` | Public, payment-sensitive | Informational pricing copy | None | Pricing cards must not grant access or enable checkout. | `pricing keeps premium plan unavailable...` |
| `/checkout` | Public route, payment-sensitive | Checkout query params only when payments enabled | Payments must remain disabled | Must fail closed unless the explicit safe payment gate is enabled after real auth and verified entitlements. | `checkout is disabled unless payments are explicitly enabled` |
| `/checkout_redirect/success` | Public payment return | Checkout redirect params | Payment provider flow disabled | Must not be treated as entitlement proof or write entitlements. | Core route/build coverage |
| `/privacy-policy` | Public legal | Static legal content | None | Legal copy only. | Mobile smoke |
| `/terms-and-conditions` | Public legal | Static legal content | None | Legal copy only. | Build coverage |
| `/refund-policy` | Public legal | Static legal content | None | Legal copy only; does not enable refunds/payments. | Build coverage |
| `/mobile-study` | Public mobile scope | Mobile route links | None | Must expose only quizzes, flashcards, and notes. | Mobile scope E2E |
| `/mobile-quizzes` | Public mobile scope | Static/mobile quiz entry content | None | Must not expose checkout, pricing CTAs, dashboard, or progress nav. | Mobile scope E2E |
| `/mobile-flashcards` | Public mobile scope | Static flashcard review content | None | Must not expose paid flows. | Mobile scope E2E |
| `/mobile-notes` | Public mobile scope | Static notes entry content | None | Must not expose paid flows. | Mobile scope E2E |
| `/courses` | Auth-required | Catalog, course selection sync, user-owned selection data | Clerk when configured; local learner session fallback otherwise | User-owned Convex data must resolve through authenticated identity or allowed local fallback. | Signed-out guard E2E |
| `/courses/[id]` | Auth-required, entitlement-sensitive | Course catalog, lessons, optional access metadata | Same as `/courses` | Future paid courses must fail closed unless server entitlement is active. | Build/SSG, route guard via learner path coverage |
| `/learn/[lessonId]` | Auth-required, user-owned writes, entitlement-sensitive | Lesson catalog, lesson progress, notes, tutor placeholder | Same as `/courses` | Lesson progress and notes must not write to another user; future paid lessons must fail closed. | Mobile lesson smoke, Convex identity unit tests |
| `/quizzes` | Auth-required | Quiz catalog and quiz attempt history | Same as `/courses` | Attempt history is user-owned and must resolve server-side identity in production. | Signed-out guard E2E |
| `/quiz/[quizId]` | Auth-required, user-owned writes, entitlement-sensitive | Quiz content and submitted attempts | Same as `/courses` | Quiz submissions must not trust forged client `userKey`; future paid quizzes must fail closed. | Quiz completion E2E, Convex identity unit tests |
| `/dashboard` | Auth-required, user-owned data | Local/Convex profile, course, quiz, lesson, study stats summaries | Same as `/courses` | Dashboard must not show fabricated progress or leak another learner's data. | Signed-out guard E2E, no mock progress E2E |
| `/progress` | Auth-required, user-owned data | Course selection, quiz history, lesson progress, study stats | Same as `/courses` | Progress summaries must not silently write/read without trusted identity. | Signed-out guard E2E, no mock progress E2E |
| `/profile` | Auth-required, user-owned data | Learner session, Clerk/local profile display, academic profile | Same as `/courses` | Profile data must remain scoped to the resolved learner identity. | Signed-out guard E2E |

## Convex User-Owned Data Paths

| Function group | Category | Identity source | Production behavior | Test coverage |
| --- | --- | --- | --- | --- |
| `academicProfiles` | User-owned query/mutation | `resolveLearnerUserKey` | Authenticated Convex identity wins; production-like fallback rejects browser `userKey`. | `convex-identity.test.ts` |
| `courseSelections` | User-owned query/mutation | `resolveLearnerUserKey` | Same policy as academic profiles. | `convex-identity.test.ts` |
| `quizzes.submitQuizAttempt`, `quizzes.getQuizAttempts` | User-owned mutation/query | `resolveLearnerUserKey` | Forged client `userKey` cannot override authenticated identity. | `convex-identity.test.ts`, quiz E2E |
| `lessons.updateLessonProgress` | User-owned mutation | `resolveLearnerUserKey` | Missing trusted identity fails closed in production-like environments. | `convex-identity.test.ts` |
| `progress` summaries | User-owned queries | `resolveLearnerUserKey` | Reads are scoped to the resolved user key. | `convex-identity.test.ts` |
| `notes` | User-owned query/mutation | `resolveLearnerUserKey` | Notes are scoped by resolved user key plus lesson id. | `convex-identity.test.ts` |
| `studyStats` | User-owned query/mutation | `resolveLearnerUserKey` | Study stats are scoped to the resolved user key. | `convex-identity.test.ts` |
| `learnerMigration` | Migration-only mutation | Authenticated destination plus strict local source key | Placeholder, authenticated, malformed, empty, and same-source keys are rejected. | `convex-identity.test.ts`, `local-learner-migration.test.ts` |
| `entitlements.getPaidAccessDecision` | Payment/entitlement-sensitive query | `resolveLearnerUserKey` plus server entitlement record | Paid access fails closed unless an active, unexpired server entitlement exists. | `entitlements.test.ts` |
| `entitlements.applyVerifiedBillingEntitlementEvent` | Internal payment/entitlement mutation | Internal verified billing event payload | Not callable from the frontend; maps verified billing lifecycle events into entitlement status updates. | `billing-lifecycle.test.ts` |
| `courses`, `lessons`, catalog `quizzes` | Public/read-only catalog | None for catalog reads | Catalog content remains readable; user-owned progress is separate. | Route/build coverage |
| `seedEducationCatalog` | Internal/admin | Internal Convex mutation | Must remain internal/developer-only. | Manual/code review |

## Production Notes

- `PageShell` is the route guard boundary for learner app routes. Clerk auth is required when Clerk env exists; local learner sessions remain the development fallback when Clerk env is missing.
- Frontend Convex sync must not write without a resolved Convex learner identity. In local/Convex-only mode that means a local learner key; in Clerk+Convex mode the placeholder is acceptable only because authenticated Convex identity must override it server-side.
- `ALLOW_LOCAL_USERKEY_FALLBACK` must stay unset or `false` in production.
- `convex/auth.config.ts` must not be added until `CLERK_JWT_ISSUER_DOMAIN` is configured.
- Checkout and paid access remain blocked until real auth, verified webhook writes, subscription lifecycle handling, and server-side entitlements are complete. See `docs/billing-entitlement-lifecycle.md`.
