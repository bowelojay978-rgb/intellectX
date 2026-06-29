export function isLearnerAppPath(pathname: string) {
  return (
    pathname === "/dashboard" ||
    pathname === "/profile" ||
    pathname === "/courses" ||
    pathname.startsWith("/courses/") ||
    pathname === "/quizzes" ||
    pathname === "/progress" ||
    pathname.startsWith("/learn/") ||
    pathname.startsWith("/quiz/")
  );
}
