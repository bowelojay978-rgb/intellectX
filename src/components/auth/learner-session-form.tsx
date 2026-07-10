"use client";

import { LearnerOnboarding } from "@/components/auth/learner-onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAcademicProfileComplete, loadAcademicProfile } from "@/lib/academic-profile";
import { createLearnerSession, getLearnerSession, type LearnerSession } from "@/lib/learner-session";
import { cn } from "@/lib/utils";
import { ArrowRightIcon, MailIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type InputHTMLAttributes, useEffect, useState } from "react";

type LearnerSessionMode = "login" | "signup" | "forgot-password";

type LearnerSessionFormProps = {
  mode: LearnerSessionMode;
};

const contentByMode = {
  login: {
    eyebrow: "Learner access",
    title: "Welcome back",
    description: "Use your learner email and password to continue with a browser-backed session on this device.",
    submitLabel: "Continue",
  },
  signup: {
    eyebrow: "Learner profile",
    title: "Create your learner session",
    description: "Add your learner details, then complete your study profile and course selection before entering IntellectX.",
    submitLabel: "Continue to onboarding",
  },
  "forgot-password": {
    eyebrow: "Account recovery",
    title: "Return to learner access",
    description: "Password recovery is not available for browser-backed sessions yet. Return to login to continue.",
    submitLabel: "Return to login",
  },
} satisfies Record<LearnerSessionMode, { eyebrow: string; title: string; description: string; submitLabel: string }>;

export function LearnerSessionForm({ mode }: LearnerSessionFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingSession, setPendingSession] = useState<LearnerSession | null>(null);
  const content = contentByMode[mode];
  const isSignup = mode === "signup";
  const isForgotPassword = mode === "forgot-password";
  const isProfileSetup = isSignup && pendingSession;

  useEffect(() => {
    if (!isSignup) return;

    const existingSession = getLearnerSession();
    if (existingSession && !isAcademicProfileComplete(loadAcademicProfile())) {
      setPendingSession(existingSession);
    }
  }, [isSignup]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isForgotPassword) {
      router.push("/login");
      return;
    }

    const nextSession: LearnerSession = {
      name: isSignup ? name.trim() || "Learner" : email.split("@")[0] || "Learner",
      email: email.trim() || "learner@intellectx.local",
      role: "student",
    };

    if (isSignup) {
      setPendingSession(nextSession);
      return;
    }

    createLearnerSession(nextSession);
    window.location.assign("/courses");
  }

  function completeSignup() {
    if (!pendingSession) return;

    createLearnerSession(pendingSession);
    window.location.assign("/courses");
  }

  return (
    <Card className="border-white/70 bg-white/85 shadow-3xl backdrop-blur dark:border-white/10 dark:bg-card/85">
      <CardHeader className="gap-4">
        <div className="bg-primary/10 text-primary grid size-11 place-items-center rounded-full">
          {isForgotPassword ? <MailIcon className="size-5" /> : <SparklesIcon className="size-5" />}
        </div>
        <div>
          <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-[0.18em] uppercase">
            {content.eyebrow}
          </p>
          <CardTitle className="text-3xl font-medium tracking-tight">{content.title}</CardTitle>
          <CardDescription className="mt-3 leading-6">{content.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isProfileSetup ? (
          <div className="grid gap-5">
            <div className="rounded-lg border border-dashed border-primary/25 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
              Complete your study profile and choose your courses before entering IntellectX.
            </div>
            <LearnerOnboarding
              loadSavedProfile={false}
              completeLabel="Complete signup"
              onComplete={completeSignup}
            />
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            {isSignup ? (
              <AuthField
                label="Name"
                name="name"
                placeholder="Your name"
                autoComplete="name"
                value={name}
                onChange={setName}
              />
            ) : null}
            <AuthField
              label="Email"
              name="email"
              type="email"
              placeholder="learner@intellectx.local"
              autoComplete="email"
              value={email}
              onChange={setEmail}
            />
            {!isForgotPassword ? (
              <AuthField
                label="Password"
                name="password"
                type="password"
                placeholder="Anything works here"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={setPassword}
              />
            ) : null}
            <div className="rounded-lg border border-dashed border-primary/25 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
              Browser-backed session: learner details stay on this device until logout or browser storage is cleared.
            </div>
            <Button type="submit" size="lg" className="mt-2 w-full">
              {content.submitLabel}
              <ArrowRightIcon className="size-4" />
            </Button>
          </form>
        )}
        {!isProfileSetup ? <AuthFooter mode={mode} /> : null}
      </CardContent>
    </Card>
  );
}

type AuthFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "name" | "value" | "onChange">;

function AuthField({ label, name, value, onChange, ...props }: AuthFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium" htmlFor={name}>
      {label}
      <input
        id={name}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "border-input bg-background/80 h-11 rounded-lg border px-4 text-sm outline-none transition-all",
          "placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-ring/40 focus:ring-[3px]",
        )}
        {...props}
      />
    </label>
  );
}

function AuthFooter({ mode }: { mode: LearnerSessionMode }) {
  if (mode === "login") {
    return (
      <div className="text-muted-foreground mt-6 flex flex-col gap-2 text-center text-sm sm:flex-row sm:justify-between">
        <Link href="/forgot-password" className="underline underline-offset-4">
          Forgot password?
        </Link>
        <span>
          New here?{" "}
          <Link href="/signup" className="text-foreground font-medium underline underline-offset-4">
            Sign up
          </Link>
        </span>
      </div>
    );
  }

  if (mode === "signup") {
    return (
      <div className="text-muted-foreground mt-6 grid gap-2 text-center text-sm">
        <p>After signup, complete your study profile and choose your courses before entering IntellectX.</p>
        <p>
          Already have a learner session?{" "}
          <Link href="/login" className="text-foreground font-medium underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <p className="text-muted-foreground mt-6 text-center text-sm">
      Remembered it?{" "}
      <Link href="/login" className="text-foreground font-medium underline underline-offset-4">
        Back to login
      </Link>
    </p>
  );
}
