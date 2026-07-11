import { describe, expect, it } from "vitest";

import { resolveMobileNavigationSurface } from "@/lib/navigation-surface";

const webItems = [
  { label: "Courses", href: "/courses" },
  { label: "Quizzes", href: "/quizzes" },
  { label: "Profile", href: "/profile" },
];

const nativeItems = [
  { label: "Quizzes", href: "/mobile-quizzes" },
  { label: "Flashcards", href: "/mobile-flashcards" },
];

describe("mobile navigation surface routing", () => {
  it("keeps responsive web navigation on normal web routes", () => {
    expect(
      resolveMobileNavigationSurface({
        nativeAppSurface: false,
        webItems,
        webLogoHref: "/courses",
        nativeItems,
        nativeLogoHref: "/mobile-quizzes",
      }),
    ).toEqual({
      items: webItems,
      logoHref: "/courses",
    });
  });

  it("uses dedicated mobile-app routes only on a native Capacitor surface", () => {
    expect(
      resolveMobileNavigationSurface({
        nativeAppSurface: true,
        webItems,
        webLogoHref: "/courses",
        nativeItems,
        nativeLogoHref: "/mobile-quizzes",
      }),
    ).toEqual({
      items: nativeItems,
      logoHref: "/mobile-quizzes",
    });
  });
});
