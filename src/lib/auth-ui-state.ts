export type ClerkSessionUiState = "loading" | "signed-out" | "signed-in";

export type AuthenticatedAppUiState =
  | "ready"
  | "loading-auth"
  | "redirecting-login"
  | "preparing-account";

export function resolveClerkSessionUiState({
  isLoaded,
  isSignedIn,
}: {
  isLoaded: boolean;
  isSignedIn: boolean;
}): ClerkSessionUiState {
  if (!isLoaded) {
    return "loading";
  }

  return isSignedIn ? "signed-in" : "signed-out";
}

export function resolveAuthenticatedAppUiState({
  authenticatedAppPath,
  isLoaded,
  isSignedIn,
  userId,
  preparedUserId,
}: {
  authenticatedAppPath: boolean;
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  preparedUserId: string | null;
}): AuthenticatedAppUiState {
  if (!authenticatedAppPath) {
    return "ready";
  }

  if (!isLoaded) {
    return "loading-auth";
  }

  if (!isSignedIn || !userId) {
    return "redirecting-login";
  }

  if (preparedUserId !== userId) {
    return "preparing-account";
  }

  return "ready";
}
