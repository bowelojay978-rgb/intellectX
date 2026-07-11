"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getClerkDisplayName, getLocalLearnerDisplayName } from "@/lib/auth-identity";
import { isClerkAuthEnabled } from "@/lib/auth-mode";
import {
  getLearnerSession,
  LEARNER_SESSION_CHANGE_EVENT,
  type LearnerSession,
} from "@/lib/learner-session";
import { useUser } from "@clerk/nextjs";
import { CameraIcon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const PROFILE_AVATAR_STORAGE_PREFIX = "intellectx:profile-avatar:";
const MAX_AVATAR_BYTES = 1_500_000;

type ProfileAvatarViewProps = {
  displayName: string;
  storageScope: string;
  accountImageUrl?: string | null;
};

function getInitials(displayName: string) {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "IX";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "IX";
}

function getAvatarGradient(displayName: string) {
  const hash = Array.from(displayName).reduce((total, character) => total + character.charCodeAt(0), 0);
  const firstHue = hash % 360;
  const secondHue = (firstHue + 55) % 360;
  return `linear-gradient(135deg, hsl(${firstHue} 72% 48%), hsl(${secondHue} 72% 42%))`;
}

function getStorageKey(storageScope: string) {
  return `${PROFILE_AVATAR_STORAGE_PREFIX}${encodeURIComponent(storageScope)}`;
}

export function ProfileAvatarEditor() {
  if (isClerkAuthEnabled()) {
    return <ClerkProfileAvatarEditor />;
  }

  return <LocalProfileAvatarEditor />;
}

function ClerkProfileAvatarEditor() {
  const { isLoaded, isSignedIn, user } = useUser();
  const displayName = isLoaded && isSignedIn ? getClerkDisplayName(user, "Learner") : "Learner";
  const storageScope = isLoaded && isSignedIn && user?.id ? `clerk:${user.id}` : "clerk:pending";
  const accountImageUrl = isLoaded && isSignedIn ? user?.imageUrl : null;

  return (
    <ProfileAvatarView
      displayName={displayName}
      storageScope={storageScope}
      accountImageUrl={accountImageUrl}
    />
  );
}

function LocalProfileAvatarEditor() {
  const [session, setSession] = useState<LearnerSession | null>(null);

  useEffect(() => {
    function syncSession() {
      setSession(getLearnerSession());
    }

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener(LEARNER_SESSION_CHANGE_EVENT, syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(LEARNER_SESSION_CHANGE_EVENT, syncSession);
    };
  }, []);

  const displayName = getLocalLearnerDisplayName(session, "Learner");
  const storageScope = session?.email ? `local:${session.email.toLowerCase()}` : "local:anonymous";

  return <ProfileAvatarView displayName={displayName} storageScope={storageScope} />;
}

function ProfileAvatarView({ displayName, storageScope, accountImageUrl }: ProfileAvatarViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const storageKey = useMemo(() => getStorageKey(storageScope), [storageScope]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const fallbackGradient = useMemo(() => getAvatarGradient(displayName), [displayName]);
  const imageSource = uploadedAvatar || accountImageUrl || null;

  useEffect(() => {
    function syncStoredAvatar() {
      setUploadedAvatar(window.localStorage.getItem(storageKey));
    }

    syncStoredAvatar();
    window.addEventListener("storage", syncStoredAvatar);

    return () => {
      window.removeEventListener("storage", syncStoredAvatar);
    };
  }, [storageKey]);

  function handleAvatarSelected(file: File | undefined) {
    setError(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file such as JPG, PNG, or WebP.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setError("Profile pictures must be smaller than 1.5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Unable to read that image.");
        return;
      }

      try {
        window.localStorage.setItem(storageKey, reader.result);
        setUploadedAvatar(reader.result);
      } catch {
        setError("This browser could not save the profile picture. Try a smaller image.");
      }
    };
    reader.onerror = () => setError("Unable to read that image.");
    reader.readAsDataURL(file);
  }

  function removeUploadedAvatar() {
    window.localStorage.removeItem(storageKey);
    setUploadedAvatar(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-3">
      <Avatar className="size-24 border-4 border-background shadow-lg">
        {imageSource ? <AvatarImage src={imageSource} alt={`${displayName} profile picture`} className="object-cover" /> : null}
        <AvatarFallback
          className="text-xl font-semibold text-white"
          style={{ background: fallbackGradient }}
          aria-label={`${displayName} generated avatar`}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => handleAvatarSelected(event.target.files?.[0])}
        aria-label="Choose profile picture"
      />

      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          <CameraIcon className="size-4" />
          {uploadedAvatar ? "Change photo" : "Upload photo"}
        </Button>

        {uploadedAvatar ? (
          <Button type="button" size="sm" variant="ghost" onClick={removeUploadedAvatar}>
            <Trash2Icon className="size-4" />
            Remove
          </Button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="max-w-56 text-center text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
