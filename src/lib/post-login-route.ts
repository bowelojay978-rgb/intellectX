import { resolveTrustedStaffRoleFromClaims } from "@/lib/staff-route-runtime-access";

export function resolvePostLoginRouteFromClaims(claims: unknown) {
  const role = resolveTrustedStaffRoleFromClaims(claims);

  if (role === "admin") return "/admin";
  if (role === "instructor") return "/instructor";

  return "/courses";
}
