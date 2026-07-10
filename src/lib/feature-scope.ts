export type AppSurface = "web" | "mobile";

export type StudyFeature = "quizzes" | "flashcards" | "notes";

const mobileStudyFeatures = ["quizzes", "flashcards"] as const satisfies readonly StudyFeature[];

const mobileAllowedRoutePrefixes = [
  "/mobile-study",
  "/mobile-quizzes",
  "/mobile-flashcards",
  "/mobile-notes",
  "/quizzes",
  "/quiz/",
  "/learn/",
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

  // The app does not import @capacitor/core in the web bundle yet. Capacitor injects
  // window.Capacitor at runtime in the native wrapper, so this keeps SSR and web
  // builds safe while giving the mobile app a single detection point.
  if (maybeWindow.Capacitor?.isNativePlatform?.()) {
    return true;
  }

  const platform = maybeWindow.Capacitor?.getPlatform?.();
  return platform === "ios" || platform === "android";
}

export function isFeatureAllowedOnSurface(feature: StudyFeature, surface: AppSurface) {
  if (surface === "web") {
    return true;
  }

  return mobileStudyFeatures.includes(feature);
}

export function isFeatureAllowedOnMobile(feature: StudyFeature) {
  return isFeatureAllowedOnSurface(feature, "mobile");
}

export function isRouteWebOnly(pathname: string) {
  const normalizedPathname = pathname === "" ? "/" : pathname;

  if (normalizedPathname === "/") {
    return true;
  }

  return !mobileAllowedRoutePrefixes.some(
    (prefix) => normalizedPathname === prefix || normalizedPathname.startsWith(prefix),
  );
}
