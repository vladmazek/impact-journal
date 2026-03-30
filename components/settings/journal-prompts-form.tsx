"use client";

import { type ReactNode, useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";

import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialSettingsActionState } from "@/lib/actions/settings-state";
import {
  resetJournalPromptsAction,
  updateJournalPromptsAction,
} from "@/lib/actions/settings";
import {
  JOURNAL_PROMPT_TEXT_MAX_LENGTH,
  JOURNAL_PROMPT_TITLE_MAX_LENGTH,
  type JournalPromptConfig,
} from "@/lib/journal/journal-prompts";

type JournalPromptsFormProps = {
  promptConfig: JournalPromptConfig;
};

type PromptEditorFieldProps = {
  defaultValue: string;
  description?: string;
  label: string;
  maxLength: number;
  multiline?: boolean;
  name: string;
  testId: string;
};

type PromptEditorPanelProps = {
  children: ReactNode;
  description: string;
  title: string;
};

function PromptEditorField({
  defaultValue,
  description,
  label,
  maxLength,
  multiline = false,
  name,
  testId,
}: PromptEditorFieldProps) {
  const inputId = `journal-prompts-${name}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      {description ? <p className="text-xs leading-5 text-muted-foreground">{description}</p> : null}
      {multiline ? (
        <Textarea
          className="min-h-[96px] bg-background/70"
          data-testid={testId}
          defaultValue={defaultValue}
          id={inputId}
          maxLength={maxLength}
          name={name}
        />
      ) : (
        <Input
          className="bg-background/70"
          data-testid={testId}
          defaultValue={defaultValue}
          id={inputId}
          maxLength={maxLength}
          name={name}
        />
      )}
    </div>
  );
}

function PromptEditorPanel({ children, description, title }: PromptEditorPanelProps) {
  return (
    <section className="rounded-[28px] border border-border/70 bg-background/50 p-5 sm:p-6">
      <div className="space-y-2">
        <h3 className="font-serif text-2xl tracking-tight text-foreground">{title}</h3>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function SettingsFeedback({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  if (!error && !success) {
    return null;
  }

  if (error) {
    return (
      <p className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
        {error}
      </p>
    );
  }

  return (
    <p className="rounded-2xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
      {success}
    </p>
  );
}

export function JournalPromptsForm({ promptConfig }: JournalPromptsFormProps) {
  const router = useRouter();
  const [saveState, saveAction] = useFormState(
    updateJournalPromptsAction,
    initialSettingsActionState,
  );
  const [resetState, resetAction] = useFormState(
    resetJournalPromptsAction,
    initialSettingsActionState,
  );

  useEffect(() => {
    if (saveState.success || resetState.success) {
      router.refresh();
    }
  }, [resetState.success, router, saveState.success]);

  const feedback = resetState.error
    ? resetState
    : resetState.success
      ? resetState
      : saveState;

  return (
    <div className="space-y-5">
      <form action={saveAction} className="space-y-5" data-testid="journal-prompts-form">
        <div className="grid gap-4 xl:grid-cols-2">
          <PromptEditorPanel
            description="Keep the morning structure familiar, while making each card sound more like your own journal."
            title="Morning"
          >
            <div className="space-y-5 rounded-[24px] border border-border/60 bg-background/55 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
                Section header
              </p>
              <PromptEditorField
                defaultValue={promptConfig.morning.section.title}
                label="Morning title"
                maxLength={JOURNAL_PROMPT_TITLE_MAX_LENGTH}
                name="morning.section.title"
                testId="journal-prompts-morning-section-title"
              />
              <PromptEditorField
                defaultValue={promptConfig.morning.section.description}
                label="Morning description"
                maxLength={JOURNAL_PROMPT_TEXT_MAX_LENGTH}
                multiline
                name="morning.section.description"
                testId="journal-prompts-morning-section-description"
              />
            </div>

            <div className="space-y-5 rounded-[24px] border border-border/60 bg-background/55 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
                Gratitudes card
              </p>
              <PromptEditorField
                defaultValue={promptConfig.morning.gratitudes.title}
                label="Gratitudes title"
                maxLength={JOURNAL_PROMPT_TITLE_MAX_LENGTH}
                name="morning.gratitudes.title"
                testId="journal-prompts-morning-gratitudes-title"
              />
              <PromptEditorField
                defaultValue={promptConfig.morning.gratitudes.description}
                label="Gratitudes description"
                maxLength={JOURNAL_PROMPT_TEXT_MAX_LENGTH}
                multiline
                name="morning.gratitudes.description"
                testId="journal-prompts-morning-gratitudes-description"
              />
              <PromptEditorField
                defaultValue={promptConfig.morning.gratitudes.placeholders[0]}
                label="Gratitude line 1 placeholder"
                maxLength={JOURNAL_PROMPT_TEXT_MAX_LENGTH}
                name="morning.gratitudes.placeholders.0"
                testId="journal-prompts-morning-gratitudes-placeholder-0"
              />
              <PromptEditorField
                defaultValue={promptConfig.morning.gratitudes.placeholders[1]}
                label="Gratitude line 2 placeholder"
                maxLength={JOURNAL_PROMPT_TEXT_MAX_LENGTH}
                name="morning.gratitudes.placeholders.1"
                testId="journal-prompts-morning-gratitudes-placeholder-1"
              />
              <PromptEditorField
                defaultValue={promptConfig.morning.gratitudes.placeholders[2]}
                label="Gratitude line 3 placeholder"
                maxLength={JOURNAL_PROMPT_TEXT_MAX_LENGTH}
                name="morning.gratitudes.placeholders.2"
                testId="journal-prompts-morning-gratitudes-placeholder-2"
              />
            </div>

            <div className="space-y-5 rounded-[24px] border border-border/60 bg-background/55 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">Writing cards</p>
              <PromptEditorField
                defaultValue={promptConfig.morning.todayGreat.title}
                label="Today great title"
                maxLength={JOURNAL_PROMPT_TITLE_MAX_LENGTH}
                name="morning.todayGreat.title"
                testId="journal-prompts-morning-today-great-title"
              />
              <PromptEditorField
                defaultValue={promptConfig.morning.todayGreat.placeholder}
                label="Today great placeholder"
                maxLength={JOURNAL_PROMPT_TEXT_MAX_LENGTH}
                multiline
                name="morning.todayGreat.placeholder"
                testId="journal-prompts-morning-today-great-placeholder"
              />
              <PromptEditorField
                defaultValue={promptConfig.morning.affirmation.title}
                label="Affirmation title"
                maxLength={JOURNAL_PROMPT_TITLE_MAX_LENGTH}
                name="morning.affirmation.title"
                testId="journal-prompts-morning-affirmation-title"
              />
              <PromptEditorField
                defaultValue={promptConfig.morning.affirmation.placeholder}
                label="Affirmation placeholder"
                maxLength={JOURNAL_PROMPT_TEXT_MAX_LENGTH}
                multiline
                name="morning.affirmation.placeholder"
                testId="journal-prompts-morning-affirmation-placeholder"
              />
            </div>
          </PromptEditorPanel>

          <PromptEditorPanel
            description="Let the evening prompts reflect how you actually like to close the day, without changing the calm one-page layout."
            title="Evening"
          >
            <div className="space-y-5 rounded-[24px] border border-border/60 bg-background/55 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
                Section header
              </p>
              <PromptEditorField
                defaultValue={promptConfig.evening.section.title}
                label="Evening title"
                maxLength={JOURNAL_PROMPT_TITLE_MAX_LENGTH}
                name="evening.section.title"
                testId="journal-prompts-evening-section-title"
              />
              <PromptEditorField
                defaultValue={promptConfig.evening.section.description}
                label="Evening description"
                maxLength={JOURNAL_PROMPT_TEXT_MAX_LENGTH}
                multiline
                name="evening.section.description"
                testId="journal-prompts-evening-section-description"
              />
            </div>

            <div className="space-y-5 rounded-[24px] border border-border/60 bg-background/55 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
                Good-things card
              </p>
              <PromptEditorField
                defaultValue={promptConfig.evening.goodThings.title}
                label="Good things title"
                maxLength={JOURNAL_PROMPT_TITLE_MAX_LENGTH}
                name="evening.goodThings.title"
                testId="journal-prompts-evening-good-things-title"
              />
              <PromptEditorField
                defaultValue={promptConfig.evening.goodThings.description}
                label="Good things description"
                maxLength={JOURNAL_PROMPT_TEXT_MAX_LENGTH}
                multiline
                name="evening.goodThings.description"
                testId="journal-prompts-evening-good-things-description"
              />
              <PromptEditorField
                defaultValue={promptConfig.evening.goodThings.placeholders[0]}
                label="Good thing line 1 placeholder"
                maxLength={JOURNAL_PROMPT_TEXT_MAX_LENGTH}
                name="evening.goodThings.placeholders.0"
                testId="journal-prompts-evening-good-things-placeholder-0"
              />
              <PromptEditorField
                defaultValue={promptConfig.evening.goodThings.placeholders[1]}
                label="Good thing line 2 placeholder"
                maxLength={JOURNAL_PROMPT_TEXT_MAX_LENGTH}
                name="evening.goodThings.placeholders.1"
                testId="journal-prompts-evening-good-things-placeholder-1"
              />
              <PromptEditorField
                defaultValue={promptConfig.evening.goodThings.placeholders[2]}
                label="Good thing line 3 placeholder"
                maxLength={JOURNAL_PROMPT_TEXT_MAX_LENGTH}
                name="evening.goodThings.placeholders.2"
                testId="journal-prompts-evening-good-things-placeholder-2"
              />
            </div>

            <div className="space-y-5 rounded-[24px] border border-border/60 bg-background/55 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
                Reflection card
              </p>
              <PromptEditorField
                defaultValue={promptConfig.evening.improveTomorrow.title}
                label="Reflection title"
                maxLength={JOURNAL_PROMPT_TITLE_MAX_LENGTH}
                name="evening.improveTomorrow.title"
                testId="journal-prompts-evening-improve-tomorrow-title"
              />
              <PromptEditorField
                defaultValue={promptConfig.evening.improveTomorrow.placeholder}
                label="Reflection placeholder"
                maxLength={JOURNAL_PROMPT_TEXT_MAX_LENGTH}
                multiline
                name="evening.improveTomorrow.placeholder"
                testId="journal-prompts-evening-improve-tomorrow-placeholder"
              />
            </div>
          </PromptEditorPanel>
        </div>

        <SettingsFeedback error={feedback.error} success={feedback.success} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Saving here updates the live morning and evening prompt copy across every daily page,
            including past entries.
          </p>
          <SubmitButton
            className="w-full sm:w-auto"
            idleLabel="Save journal prompts"
            pendingLabel="Saving journal prompts"
            size="lg"
          />
        </div>
      </form>

      <form
        action={resetAction}
        className="flex flex-col gap-4 rounded-[24px] border border-dashed border-border/70 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Reset every morning and evening prompt back to the shipped default copy in one step.
        </p>
        <SubmitButton
          className="w-full sm:w-auto"
          idleLabel="Reset all prompts"
          pendingLabel="Resetting prompts"
          size="lg"
          variant="outline"
        />
      </form>
    </div>
  );
}
