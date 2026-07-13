import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { NativeMobileSurfaceBoundary } from "@/components/providers/native-mobile-surface-boundary";
import { GlobalNavigationLoader } from "@/components/ui/global-navigation-loader";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://intellect-x-coral.vercel.app"),
  applicationName: "IntellectX",
  title: {
    default: "IntellectX",
    template: "%s",
  },
  description: "Premium learning paths, course lessons, quizzes, and progress tracking for focused study.",
  creator: "IntellectX",
  publisher: "IntellectX",
  openGraph: {
    type: "website",
    url: "https://intellect-x-coral.vercel.app",
    siteName: "IntellectX",
    title: "IntellectX",
    description: "Premium learning paths, course lessons, quizzes, and progress tracking for focused study.",
  },
  twitter: {
    card: "summary",
    title: "IntellectX",
    description: "Premium learning paths, course lessons, quizzes, and progress tracking for focused study.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ConvexClientProvider>
          <NativeMobileSurfaceBoundary />
          {children}
        </ConvexClientProvider>
        <Suspense fallback={null}>
          <GlobalNavigationLoader />
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
