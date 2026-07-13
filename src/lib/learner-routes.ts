export function isLearnerAppPath(pathname: string) {
  return (
    pathname === "/onboarding" ||
    pathname === "/dashboard" ||
    pathname === "/profile" ||
    pathname === "/courses" ||
    pathname.startsWith("/courses/") ||
    pathname === "/flashcards" ||
    pathname === "/quizzes" ||
    pathname === "/progress" ||
    pathname.startsWith("/learn/") ||
    pathname.startsWith("/quiz/")
  );
}

export function isAuthenticatedAppPath(pathname: string) {
  return isLearnerAppPath(pathname) || pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/instructor" || pathname.startsWith("/instructor/");
}
