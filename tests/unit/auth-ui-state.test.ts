import { describe, expect, it } from "vitest";

import { resolveAuthenticatedAppUiState, resolveClerkSessionUiState } from "@/lib/auth-ui-state";

describe("Clerk session UI state", () => {
  it("keeps a deterministic loading state while Clerk is unresolved", () => {
    expect(resolveClerkSessionUiState({ isLoaded: false, isSignedIn: false })).toBe("loading");
  });

  it("distinguishes signed-out and signed-in states once Clerk is loaded", () => {
    expect(resolveClerkSessionUiState({ isLoaded: true, isSignedIn: false })).toBe("signed-out");
    expect(resolveClerkSessionUiState({ isLoaded: true, isSignedIn: true })).toBe("signed-in");
  });
});

describe("authenticated app UI state", () => {
  const base = {
    authenticatedAppPath: true,
    isLoaded: true,
    isSignedIn: true,
    userId: "user_123",
    preparedUserId: "user_123",
  };

  it("never reports an authenticated app route as ready while auth is unresolved", () => {
    expect(resolveAuthenticatedAppUiState({ ...base, isLoaded: false })).toBe("loading-auth");
  });

  it("uses an explicit redirecting state for signed-out app access", () => {
    expect(resolveAuthenticatedAppUiState({ ...base, isSignedIn: false, userId: null })).toBe(
      "redirecting-login",
    );
  });

  it("uses an explicit preparation state while account isolation setup is incomplete", () => {
    expect(resolveAuthenticatedAppUiState({ ...base, preparedUserId: null })).toBe("preparing-account");
  });

  it("reports ready only after the authenticated user is fully prepared", () => {
    expect(resolveAuthenticatedAppUiState(base)).toBe("ready");
  });

  it("keeps public routes visible regardless of Clerk loading state", () => {
    expect(
      resolveAuthenticatedAppUiState({
        ...base,
        authenticatedAppPath: false,
        isLoaded: false,
        isSignedIn: false,
        userId: null,
        preparedUserId: null,
      }),
    ).toBe("ready");
  });
});
