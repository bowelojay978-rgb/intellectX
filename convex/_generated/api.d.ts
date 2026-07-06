/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academicProfiles from "../academicProfiles.js";
import type * as aiTutor from "../aiTutor.js";
import type * as courseSelections from "../courseSelections.js";
import type * as courses from "../courses.js";
import type * as lessons from "../lessons.js";
import type * as lib_identity from "../lib/identity.js";
import type * as notes from "../notes.js";
import type * as progress from "../progress.js";
import type * as quizzes from "../quizzes.js";
import type * as seed from "../seed.js";
import type * as studyStats from "../studyStats.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  academicProfiles: typeof academicProfiles;
  aiTutor: typeof aiTutor;
  courseSelections: typeof courseSelections;
  courses: typeof courses;
  lessons: typeof lessons;
  "lib/identity": typeof lib_identity;
  notes: typeof notes;
  progress: typeof progress;
  quizzes: typeof quizzes;
  seed: typeof seed;
  studyStats: typeof studyStats;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
