import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ACADEMIC_PROFILE_SYNC_RETRY_EVENT,
  ACADEMIC_PROFILE_SYNC_STATUS_EVENT,
  clearAcademicProfileDraft,
  dispatchAcademicProfileSyncStatus,
  loadAcademicProfileDraft,
  requestAcademicProfileSyncRetry,
  saveAcademicProfileDraft,
  type AcademicProfile,
  type AcademicProfileSyncStatusDetail,
} from "@/lib/academic-profile";

const profileA: AcademicProfile = {
  educationLevel: "Senior",
  curriculumOrInstitution: "Botswana curriculum",
  gradeOrYear: "Form 5",
  subjectsOrModules: ["Mathematics"],
};

const profileB: AcademicProfile = {
  educationLevel: "University / Varsity",
  curriculumOrInstitution: "UB",
  gradeOrYear: "Year 2",
  subjectsOrModules: ["Computer Science"],
};

beforeEach(() => {
  localStorage.clear();
});

describe("Study Profile completion contract", () => {
  it("keeps interrupted onboarding drafts isolated by learner scope", () => {
    saveAcademicProfileDraft("user_A", profileA);
    saveAcademicProfileDraft("user_B", profileB);

    expect(loadAcademicProfileDraft("user_A")).toEqual(profileA);
    expect(loadAcademicProfileDraft("user_B")).toEqual(profileB);

    clearAcademicProfileDraft("user_A");

    expect(loadAcademicProfileDraft("user_A")).toBeNull();
    expect(loadAcademicProfileDraft("user_B")).toEqual(profileB);
  });

  it("publishes real sync status and retry events for the Study Profile UI", () => {
    const statusListener = vi.fn();
    const retryListener = vi.fn();

    window.addEventListener(ACADEMIC_PROFILE_SYNC_STATUS_EVENT, statusListener);
    window.addEventListener(ACADEMIC_PROFILE_SYNC_RETRY_EVENT, retryListener);

    dispatchAcademicProfileSyncStatus("success");
    requestAcademicProfileSyncRetry();

    expect(statusListener).toHaveBeenCalledTimes(1);
    const statusEvent = statusListener.mock.calls[0][0] as CustomEvent<AcademicProfileSyncStatusDetail>;
    expect(statusEvent.detail).toEqual({ status: "success" });
    expect(retryListener).toHaveBeenCalledTimes(1);

    window.removeEventListener(ACADEMIC_PROFILE_SYNC_STATUS_EVENT, statusListener);
    window.removeEventListener(ACADEMIC_PROFILE_SYNC_RETRY_EVENT, retryListener);
  });

  it("tracks existing Convex mutations instead of inventing a separate persistence path", () => {
    const syncSource = readFileSync(
      path.resolve(process.cwd(), "src/components/education/academic-profile-sync.tsx"),
      "utf8",
    );

    expect(syncSource).toContain('dispatchAcademicProfileSyncStatus("pending")');
    expect(syncSource).toContain('dispatchAcademicProfileSyncStatus("success")');
    expect(syncSource).toContain('dispatchAcademicProfileSyncStatus("error")');
    expect(syncSource).toContain("ACADEMIC_PROFILE_SYNC_RETRY_EVENT");
    expect(syncSource).toContain("upsertAcademicProfile(persistAcademicProfileArgs(identityArgs, localProfile))");
  });

  it("shows honest account-sync feedback and retry without losing local-save truth", () => {
    const cardSource = readFileSync(
      path.resolve(process.cwd(), "src/components/education/study-profile-card.tsx"),
      "utf8",
    );

    expect(cardSource).toContain('return "Saving to your account…"');
    expect(cardSource).toContain('return "Saved to your account"');
    expect(cardSource).toContain('return "Saved on this device"');
    expect(cardSource).toContain("could not sync this Study Profile to your account");
    expect(cardSource).toContain("Retry sync");
    expect(cardSource).toContain("requestAcademicProfileSyncRetry()");
  });
});
