import { MobileNav } from "@/components/hero/mobile-nav";
import { DesktopNav } from "@/components/hero/desktop-nav";

const navItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Courses",
    href: "/courses",
  },
  {
    label: "Quizzes",
    href: "/quizzes",
  },
  {
    label: "Progress",
    href: "/progress",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Pricing",
    href: "/pricing",
  },
  {
    label: "Profile",
    href: "/profile",
  },
];

export function Nav() {
  return (
    <>
      <MobileNav className="flex md:hidden" items={navItems} />
      <DesktopNav className="hidden md:flex" items={navItems} />
    </>
  );
}
