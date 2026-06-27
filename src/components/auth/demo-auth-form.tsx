"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createDemoSession } from "@/lib/demo-auth";
import { cn } from "@/lib/utils";
import { ArrowRightIcon, MailIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type InputHTMLAttributes, useState } from "react";

type DemoAuthMode = "login" | "signup" | "forgot-password";

type DemoAuthFormProps = {
  mode: DemoAuthMode;
};

const contentByMode = {
  login: {
    eyebrow: "Demo access",
    title: "Welcome back",
    description: "Use any email and password to enter the IntellectX prototype.",
    submitLabel: "Continue to dashboard",
  },
  signup: {
    eyebrow: "Prototype account",
    title: "Create your demo profile",
    description: "Use any details. This only creates a local browser session for testing.",
    submitLabel: "Create demo session",
  },
  "forgot-password": {
    eyebrow: "Demo reset",
    title: "Reset without the ceremony",
    description: "No real password reset is sent. This keeps prototype testing frictionless.",
    submitLabel: "Return to login",
  },
} satisfies Record<DemoAuthMode, { eyebrow: string; title: string; description: string; submitLabel: string }>;

export function DemoAuthForm({ mode }: DemoAuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const content = contentByMode[mode];
  const isSignup = mode === "signup";
  const isForgotPassword = mode === "forgot-password";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isForgotPassword) {
      router.push("/login");
      return;
    }

    createDemoSession({
      name: isSignup ? name.trim() || "Demo learner" : email.split("@")[0] || "Demo learner",
      email: email.trim() || "learner@intellectx.demo",
      role: "student",
    });

    router.push("/dashboard");
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
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {isSignup ? (
            <AuthField
              label="Name"
              name="name"
              placeholder="Maya Chen"
              autoComplete="name"
              value={name}
              onChange={setName}
            />
          ) : null}
          <AuthField
            label="Email"
            name="email"
            type="email"
            placeholder="learner@intellectx.demo"
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
            Prototype only: this stores a local demo session in your browser. No Clerk, NextAuth, backend auth, or password security is active.
          </div>
          <Button type="submit" size="lg" className="mt-2 w-full">
            {content.submitLabel}
            <ArrowRightIcon className="size-4" />
          </Button>
        </form>
        <AuthFooter mode={mode} />
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

function AuthFooter({ mode }: { mode: DemoAuthMode }) {
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
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have demo access?{" "}
        <Link href="/login" className="text-foreground font-medium underline underline-offset-4">
          Log in
        </Link>
      </p>
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
