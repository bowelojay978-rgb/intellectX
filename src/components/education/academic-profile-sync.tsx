"use client";

import {
  ACADEMIC_PROFILE_CHANGE_EVENT,
  type AcademicProfile,
  isAcademicProfile,
  isAcademicProfileComplete,
  loadAcademicProfile,
  normalizeAcademicProfileForLevel,
  saveAcademicProfile,
} from "@/lib/academic-profile";
import { convexApi } from "@/lib/convex-api";
import {
  getCurrentConvexLearnerIdentity,
  type ConvexLearnerArgs,
  type ConvexLearnerIdentity,
} from "@/lib/convex-learner-identity";
import { convexEnv } from "@/lib/education-data";
import { hasPendingLocalLearnerMigrationSource } from "@/lib/authenticated-learner-local-data";
import { hydrateAuthenticatedAcademicProfile } from "@/lib/authenticated-learner-hydration";
import { useLearnerAuthRuntime } from "@/components/providers/learner-auth-runtime-provider";
import { LEARNER_SESSION_CHANGE_EVENT } from "@/lib/learner-session";
import { hasNewerLocalEdit } from "@/lib/learner-hydration-version";
import { useConvex, useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";

function academicProfilesMatch(left: AcademicProfile, right: AcademicProfile) {
  const normalizedLeft = normalizeAcademicProfileForLevel(left);
  const normalizedRight = normalizeAcademicProfileForLevel(right);

  return (
    normalizedLeft.educationLevel === normalizedRight.educationLevel &&
    normalizedLeft.curriculumOrInstitution === normalizedRight.curriculumOrInstitution &&
    normalizedLeft.gradeOrYear === normalizedRight.gradeOrYear &&
    normalizedLeft.subjectsOrModules.length === normalizedRight.subjectsOrModules.length &&
    normalizedLeft.subjectsOrModules.every((subject, index) => subject === normalizedRight.subjectsOrModules[index])
  );
}

function persistAcademicProfileArgs(identityArgs: ConvexLearnerArgs, profile: AcademicProfile) {
  const normalizedProfile = normalizeAcademicProfileForLevel(profile);

  return {
    ...identityArgs,
    educationLevel: normalizedProfile.educationLevel,
    curriculumOrInstitution: normalizedProfile.curriculumOrInstitution,
    gradeOrYear: normalizedProfile.gradeOrYear,
    subjectsOrModules: normalizedProfile.subjectsOrModules,
  };
}

function getIdentityArgs(identity: ConvexLearnerIdentity): ConvexLearnerArgs {
  return identity.userKey ? { userKey: identity.userKey } : {};
}

export function AcademicProfileSync() {
  if (!convexEnv.isConfigured) {
    return null;
  }

  return <ConvexAcademicProfileSync />;
}

function ConvexAcademicProfileSync() {
  const convex = useConvex();
  const [identity, setIdentity] = useState<ConvexLearnerIdentity | null>(null);
  const upsertAcademicProfile = useMutation(convexApi.academicProfiles.upsertAcademicProfile);
  const clearRemoteAcademicProfile = useMutation(convexApi.academicProfiles.clearAcademicProfile);
  const remoteHydrated = useRef(false);
  const syncingRemoteToLocal = useRef(false);
  const localEditVersion = useRef(0);

  const { isLoaded, isSignedIn, userId } = useLearnerAuthRuntime();

  useEffect(() => {
    const isAuthenticated = Boolean(isLoaded && isSignedIn && userId);
    setIdentity(getCurrentConvexLearnerIdentity(isAuthenticated));

    function syncIdentity() {
      const isAuthenticated = Boolean(isLoaded && isSignedIn && userId);
      setIdentity(getCurrentConvexLearnerIdentity(isAuthenticated));
      remoteHydrated.current = false;
    }

    window.addEventListener(LEARNER_SESSION_CHANGE_EVENT, syncIdentity);
    window.addEventListener("storage", syncIdentity);

    return () => {
      window.removeEventListener(LEARNER_SESSION_CHANGE_EVENT, syncIdentity);
      window.removeEventListener("storage", syncIdentity);
    };
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!identity) {
      return;
    }

    const currentIdentity = identity;
    let cancelled = false;
    const identityArgs = getIdentityArgs(currentIdentity);
    const hydrationStartedAtVersion = localEditVersion.current;

    function persistCurrentLocalProfile() {
      if (currentIdentity.source === "authenticated-convex" && hasPendingLocalLearnerMigrationSource()) {
        return;
      }

      const localProfile = loadAcademicProfile();

      if (localProfile && isAcademicProfileComplete(localProfile)) {
        upsertAcademicProfile(persistAcademicProfileArgs(identityArgs, localProfile)).catch((error) => {
          console.warn("Unable to sync academic profile to Convex", error);
        });
        return;
      }

      clearRemoteAcademicProfile(identityArgs).catch((error) => {
        console.warn("Unable to clear academic profile from Convex", error);
      });
    }

    convex
      .query(convexApi.academicProfiles.getAcademicProfile, identityArgs)
      .then((remoteProfile) => {
        if (cancelled) return;

        remoteHydrated.current = true;

        if (hasNewerLocalEdit(hydrationStartedAtVersion, localEditVersion.current)) {
          persistCurrentLocalProfile();
          return;
        }

        if (remoteProfile && isAcademicProfile(remoteProfile)) {
          const normalizedRemoteProfile = normalizeAcademicProfileForLevel(remoteProfile);

          if (currentIdentity.source === "authenticated-convex") {
            syncingRemoteToLocal.current = true;
            hydrateAuthenticatedAcademicProfile(
              normalizedRemoteProfile,
              hasPendingLocalLearnerMigrationSource(),
            );
            window.setTimeout(() => {
              syncingRemoteToLocal.current = false;
            }, 0);
            return;
          }

          const localProfile = loadAcademicProfile();
          if (!localProfile || !academicProfilesMatch(normalizedRemoteProfile, localProfile)) {
            syncingRemoteToLocal.current = true;
            saveAcademicProfile(normalizedRemoteProfile);
            window.setTimeout(() => {
              syncingRemoteToLocal.current = false;
            }, 0);
          }

          return;
        }

        if (currentIdentity.source === "authenticated-convex") {
          syncingRemoteToLocal.current = true;
          hydrateAuthenticatedAcademicProfile(null, hasPendingLocalLearnerMigrationSource());
          window.setTimeout(() => {
            syncingRemoteToLocal.current = false;
          }, 0);
          return;
        }

        const localProfile = loadAcademicProfile();
        if (localProfile && isAcademicProfileComplete(localProfile)) {
          upsertAcademicProfile(persistAcademicProfileArgs(identityArgs, localProfile)).catch((error) => {
            console.warn("Unable to sync local academic profile to Convex", error);
          });
        }
      })
      .catch((error) => {
        if (cancelled) return;

        remoteHydrated.current = false;
        console.warn("Unable to load academic profile from Convex", error);
      });

    return () => {
      cancelled = true;
    };
  }, [clearRemoteAcademicProfile, convex, identity, upsertAcademicProfile]);

  useEffect(() => {
    function syncLocalProfileToConvex() {
      if (syncingRemoteToLocal.current) {
        return;
      }

      localEditVersion.current += 1;

      if (!identity || !remoteHydrated.current) return;

      if (identity.source === "authenticated-convex" && hasPendingLocalLearnerMigrationSource()) {
        return;
      }

      const identityArgs = getIdentityArgs(identity);
      const localProfile = loadAcademicProfile();

      if (localProfile && isAcademicProfileComplete(localProfile)) {
        upsertAcademicProfile(persistAcademicProfileArgs(identityArgs, localProfile)).catch((error) => {
          console.warn("Unable to sync academic profile to Convex", error);
        });
        return;
      }

      clearRemoteAcademicProfile(identityArgs).catch((error) => {
        console.warn("Unable to clear academic profile from Convex", error);
      });
    }

    window.addEventListener(ACADEMIC_PROFILE_CHANGE_EVENT, syncLocalProfileToConvex);

    return () => {
      window.removeEventListener(ACADEMIC_PROFILE_CHANGE_EVENT, syncLocalProfileToConvex);
    };
  }, [clearRemoteAcademicProfile, identity, upsertAcademicProfile]);

  return null;
}
