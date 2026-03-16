"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";

import { updatePasswordAction } from "@/lib/actions/settings";
import { initialSettingsActionState } from "@/lib/actions/settings-state";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordSettingsForm() {
  const [state, formAction] = useFormState(
    updatePasswordAction,
    initialSettingsActionState,
  );
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-5" ref={formRef}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            autoComplete="new-password"
            id="newPassword"
            name="newPassword"
            placeholder="Choose a stronger password"
            type="password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            autoComplete="new-password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Repeat the new password"
            type="password"
          />
        </div>
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          {state.success}
        </p>
      ) : null}

      <SubmitButton
        className="w-full"
        idleLabel="Update password"
        pendingLabel="Updating password"
        size="lg"
      />
    </form>
  );
}
