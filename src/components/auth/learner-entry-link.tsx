"use client";

import { useLearnerAccessState } from "@/lib/use-learner-access-state";
import Link from "next/link";

type LearnerEntryLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  signedInHref?: string;
  signedOutHref?: string;
  signedInLabel?: React.ReactNode;
  signedOutLabel?: React.ReactNode;
};

export function LearnerEntryLink({
  signedInHref = "/dashboard",
  signedOutHref = "/signup",
  signedInLabel,
  signedOutLabel,
  children,
  ...props
}: LearnerEntryLinkProps) {
  const { isSignedIn } = useLearnerAccessState();

  return (
    <Link href={isSignedIn ? signedInHref : signedOutHref} {...props}>
      {isSignedIn ? (signedInLabel ?? children) : (signedOutLabel ?? children)}
    </Link>
  );
}
