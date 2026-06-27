import { DemoAuthStatus } from "@/components/auth/demo-auth-status";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Menu, SparklesIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  items: {
    label: string;
    href: string;
  }[];
  className?: string;
};

export function MobileNav({ items, className }: Props) {
  return (
    <nav
      className={cn(
        "fixed top-0 right-0 left-0 z-50 w-full items-center bg-transparent px-6 py-6",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-full">
            <SparklesIcon className="size-4" />
          </span>
          <span>IntellectX</span>
        </Link>
        <Drawer direction="top">
          <DrawerTrigger className="relative -m-2 cursor-pointer p-2">
            <span className="sr-only">Open menu</span>
            <Menu className="h-6 w-6" />
          </DrawerTrigger>
          <DrawerContent className="flex flex-col gap-4 p-8">
            <DrawerTitle className="sr-only">Menu</DrawerTitle>
            {items.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <DemoAuthStatus compact />
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}
