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
import type * as entitlements from "../entitlements.js";
import type * as learnerMigration from "../learnerMigration.js";
import type * as lessons from "../lessons.js";
import type * as lib_billingLifecycle from "../lib/billingLifecycle.js";
import type * as lib_courseWorkflow from "../lib/courseWorkflow.js";
import type * as lib_courseWorkflowMutations from "../lib/courseWorkflowMutations.js";
import type * as lib_entitlements from "../lib/entitlements.js";
import type * as lib_identity from "../lib/identity.js";
import type * as lib_migrateLearnerData from "../lib/migrateLearnerData.js";
import type * as lib_staffRbac from "../lib/staffRbac.js";
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
  entitlements: typeof entitlements;
  learnerMigration: typeof learnerMigration;
  lessons: typeof lessons;
  "lib/billingLifecycle": typeof lib_billingLifecycle;
  "lib/courseWorkflow": typeof lib_courseWorkflow;
  "lib/courseWorkflowMutations": typeof lib_courseWorkflowMutations;
  "lib/entitlements": typeof lib_entitlements;
  "lib/identity": typeof lib_identity;
  "lib/migrateLearnerData": typeof lib_migrateLearnerData;
  "lib/staffRbac": typeof lib_staffRbac;
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
