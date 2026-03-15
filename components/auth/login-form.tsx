"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { initialAuthActionState } from "@/lib/actions/auth-state";
import { loginAction } from "@/lib/actions/auth";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          autoComplete="email"
          id="email"
          name="email"
          placeholder="you@example.com"
          type="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          autoComplete="current-password"
          id="password"
          name="password"
          placeholder="Enter your journal password"
          type="password"
        />
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-3">
        <SubmitButton
          className="w-full"
          idleLabel="Open journal"
          pendingLabel="Opening journal"
          size="lg"
        />
        <Link
          className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full")}
          href="/setup"
        >
          Set up a new private journal
        </Link>
      </div>
    </form>
  );
}
