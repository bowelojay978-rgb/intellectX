export type AppSurface = "web" | "mobile";

export type StudyFeature = "quizzes" | "flashcards" | "notes";

const mobileStudyFeatures = ["quizzes", "flashcards"] as const satisfies readonly StudyFeature[];

const mobileAllowedRoutePrefixes = [
  "/mobile-study",
  "/mobile-quizzes",
  "/mobile-flashcards",
  "/quiz",
  "/login",
  "/signup",
  "/forgot-password",
  "/auth",
  "/onboarding",
  "/privacy-policy",
  "/terms-and-conditions",
  "/refund-policy",
] as const;

export const featureScope = {
  mobileStudyFeatures,
  mobileAllowedRoutePrefixes,
};

export function isMobileAppRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  const maybeWindow = window as Window & {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  };

  // Capacitor injects window.Capacitor in the native WebView. Keeping native
  // detection here prevents mobile routing and navigation from drifting apart.
  if (maybeWindow.Capacitor?.isNativePlatform?.()) {
    return true;
  }

  const platform = maybeWindow.Capacitor?.getPlatform?.();
  return platform === "ios" || platform === "android";
}

export function getLearnerHomeRouteForCurrentRuntime() {
  return isMobileAppRuntime() ? "/mobile-quizzes" : "/courses";
}

export function isFeatureAllowedOnSurface(feature: StudyFeature, surface: AppSurface) {
  if (surface === "web") {
    return true;
  }

  return (mobileStudyFeatures as readonly StudyFeature[]).includes(feature);
}

export function isFeatureAllowedOnMobile(feature: StudyFeature) {
  return isFeatureAllowedOnSurface(feature, "mobile");
}

function matchesRoutePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isRouteWebOnly(pathname: string) {
  const normalizedPathname = pathname === "" ? "/" : pathname;

  if (normalizedPathname === "/") {
    return true;
  }

  return !mobileAllowedRoutePrefixes.some((prefix) => matchesRoutePrefix(normalizedPathname, prefix));
}
