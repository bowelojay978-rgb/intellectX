import { DemoAuthStatus } from "@/components/auth/demo-auth-status";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { SparklesIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  items: {
    label: string;
    href: string;
  }[];
  className?: string;
};

export function DesktopNav({ items, className }: Props) {
  return (
    <nav
      className={cn(
        "fixed top-0 right-0 left-0 z-50 flex w-full items-center bg-transparent px-6 py-8 md:px-10",
        className,
      )}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Link href="/" className="flex items-center gap-2 justify-self-start font-semibold tracking-tight">
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-full">
            <SparklesIcon className="size-4" />
          </span>
          <span>IntellectX</span>
        </Link>
        <NavigationMenu className="flex-none">
          <NavigationMenuList className="gap-5">
            {items.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink href={item.href}>{item.label}</NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <DemoAuthStatus />
      </div>
    </nav>
  );
}
