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
import { convexEnv } from "@/lib/education-data";
import { getCurrentLearnerIdentity } from "@/lib/learner-session";
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

function persistAcademicProfileArgs(userKey: string, profile: AcademicProfile) {
  const normalizedProfile = normalizeAcademicProfileForLevel(profile);

  return {
    userKey,
    educationLevel: normalizedProfile.educationLevel,
    curriculumOrInstitution: normalizedProfile.curriculumOrInstitution,
    gradeOrYear: normalizedProfile.gradeOrYear,
    subjectsOrModules: normalizedProfile.subjectsOrModules,
  };
}

export function AcademicProfileSync() {
  if (!convexEnv.isConfigured) {
    return null;
  }

  return <ConvexAcademicProfileSync />;
}

function ConvexAcademicProfileSync() {
  const convex = useConvex();
  const [userKey, setUserKey] = useState<string | null>(null);
  const upsertAcademicProfile = useMutation(convexApi.academicProfiles.upsertAcademicProfile);
  const clearRemoteAcademicProfile = useMutation(convexApi.academicProfiles.clearAcademicProfile);
  const remoteHydrated = useRef(false);
  const syncingRemoteToLocal = useRef(false);

  useEffect(() => {
    setUserKey(getCurrentLearnerIdentity()?.userKey ?? null);

    function syncIdentity() {
      setUserKey(getCurrentLearnerIdentity()?.userKey ?? null);
      remoteHydrated.current = false;
    }

    window.addEventListener("intellectx:learner-session-change", syncIdentity);
    window.addEventListener("storage", syncIdentity);

    return () => {
      window.removeEventListener("intellectx:learner-session-change", syncIdentity);
      window.removeEventListener("storage", syncIdentity);
    };
  }, []);

  useEffect(() => {
    if (!userKey) {
      return;
    }

    let cancelled = false;

    convex
      .query(convexApi.academicProfiles.getAcademicProfile, { userKey })
      .then((remoteProfile) => {
        if (cancelled) return;

        if (remoteProfile && isAcademicProfile(remoteProfile)) {
          const normalizedRemoteProfile = normalizeAcademicProfileForLevel(remoteProfile);
          const localProfile = loadAcademicProfile();

          remoteHydrated.current = true;

          if (!localProfile || !academicProfilesMatch(normalizedRemoteProfile, localProfile)) {
            syncingRemoteToLocal.current = true;
            saveAcademicProfile(normalizedRemoteProfile);
            window.setTimeout(() => {
              syncingRemoteToLocal.current = false;
            }, 0);
          }

          return;
        }

        remoteHydrated.current = true;

        const localProfile = loadAcademicProfile();
        if (localProfile && isAcademicProfileComplete(localProfile)) {
          upsertAcademicProfile(persistAcademicProfileArgs(userKey, localProfile)).catch((error) => {
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
  }, [convex, upsertAcademicProfile, userKey]);

  useEffect(() => {
    function syncLocalProfileToConvex() {
      if (!userKey || !remoteHydrated.current || syncingRemoteToLocal.current) {
        return;
      }

      const localProfile = loadAcademicProfile();

      if (localProfile && isAcademicProfileComplete(localProfile)) {
        upsertAcademicProfile(persistAcademicProfileArgs(userKey, localProfile)).catch((error) => {
          console.warn("Unable to sync academic profile to Convex", error);
        });
        return;
      }

      clearRemoteAcademicProfile({ userKey }).catch((error) => {
        console.warn("Unable to clear academic profile from Convex", error);
      });
    }

    window.addEventListener(ACADEMIC_PROFILE_CHANGE_EVENT, syncLocalProfileToConvex);

    return () => {
      window.removeEventListener(ACADEMIC_PROFILE_CHANGE_EVENT, syncLocalProfileToConvex);
    };
  }, [clearRemoteAcademicProfile, upsertAcademicProfile, userKey]);

  return null;
}
