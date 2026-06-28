# QA Checklist

Use this checklist for manual production review. Do not mark items complete until they have been verified against the intended environment.

## Desktop QA

- ☐ Homepage loads without runtime errors.
- ☐ Courses page loads and course cards are readable.
- ☐ Course detail page loads for each seeded course.
- ☐ Lesson page loads and content, video placeholder, notes, and actions render.
- ☐ Quizzes page loads and quiz cards are readable.
- ☐ Dashboard loads and summary cards render.
- ☐ Progress page loads and charts render.
- ☐ Profile page loads and profile sections render.
- ☐ Pricing page loads without checkout regressions.

## Mobile Responsive QA

- ☐ Homepage loads at a phone viewport.
- ☐ Mobile navigation opens and closes correctly.
- ☐ Courses page cards stack cleanly.
- ☐ Quizzes page cards stack cleanly.
- ☐ Lesson content remains readable.
- ☐ Dashboard and progress cards do not overlap.
- ☐ Legal pages are readable without horizontal scrolling.

## Production Smoke

- ☐ Production URL loads: https://intellect-x-coral.vercel.app.
- ☐ Local preview loads when needed: http://10.156.53.238:3000.
- ☐ Custom 404 page appears for a missing route.
- ☐ robots.txt loads.
- ☐ sitemap.xml loads.
- ☐ Security headers are present on a normal app route.

## Legal Pages

- ☐ Privacy Policy loads.
- ☐ Terms and Conditions load.
- ☐ Refund Policy loads.
- ☐ Legal pages include effective date and legal review note.
- ☐ Legal pages do not invent company registration details, address, or phone number.

## Quiz Flow

- ☐ Quiz starts from the quizzes page.
- ☐ Results are not shown before the final question.
- ☐ Final results appear only at the end.
- ☐ Try again resets the quiz.
- ☐ Quiz scoring behavior matches the expected answers.

## Navigation

- ☐ Desktop navbar remains fixed while scrolling.
- ☐ Core nav links remain direct navigation items.
- ☐ Active state marks Courses on course list and detail pages.
- ☐ Active state marks Quizzes on quiz list and detail pages.
- ☐ Mobile navigation provides access to core routes.

## Convex/Catalog Sanity

- ☐ Courses in the UI match the expected seeded catalog.
- ☐ Study profile can be saved from the profile page.
- ☐ Courses page prioritizes matching subjects/modules when a study profile exists.
- ☐ Quizzes page prioritizes matching subjects/modules when a study profile exists.
- ☐ No-match study profiles show a fallback message and keep all available courses/quizzes reachable.
- ☐ Study profile remains frontend-only until backend persistence and real auth integration are added.
- ☐ Course detail pages show expected lessons.
- ☐ Course detail pages show expected quizzes.
- ☐ Lesson routes resolve for seeded lessons.
- ☐ Quiz routes resolve for seeded quizzes.
- ☐ Fallback data remains usable if Convex is not configured locally.

## Deployment Verification

- ☐ Vercel deployment finishes successfully.
- ☐ Build output includes robots.txt and sitemap.xml.
- ☐ Required environment variables are present in Vercel.
- ☐ No secrets are printed in logs.
- ☐ E2E smoke tests pass before release.
