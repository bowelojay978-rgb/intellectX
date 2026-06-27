import { Footer } from "@/components/footer/footer";
import { Nav } from "@/components/hero/nav";
import { BackgroundBlur } from "@/components/ui/background-blur";

type PageShellProps = {
  children: React.ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <>
      <div className="relative isolate z-10 min-h-screen overflow-hidden px-6 pt-28 pb-8 md:px-10">
        <BackgroundBlur className="-top-40 md:-top-0" />
        <Nav />
        <main className="relative z-10 mx-auto w-full max-w-6xl">{children}</main>
      </div>
      <Footer />
    </>
  );
}
