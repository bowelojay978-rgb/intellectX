import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IntellectX",
  description: "AI-powered learning paths, courses, quizzes, and study progress for modern learners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
