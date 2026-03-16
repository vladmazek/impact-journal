"use client";

import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type WritingModalProps = {
  description?: string;
  dateLabel: string;
  eyebrow?: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onTextareaBlur?: () => void;
  onTextareaFocus?: () => void;
  open: boolean;
  placeholder?: string;
  testId?: string;
  title?: string;
  value: string;
};

export function WritingModal({
  description,
  dateLabel,
  eyebrow = "Daily capture",
  onChange,
  onClose,
  onTextareaBlur,
  onTextareaFocus,
  open,
  placeholder,
  testId = "writing-textarea",
  title = "Write freely",
  value,
}: WritingModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!isMounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        aria-label="Close writing modal"
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-none border border-border/70 bg-card/95 shadow-journal sm:h-auto sm:max-h-[92vh] sm:rounded-[32px]"
        data-testid="writing-modal"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-5 sm:px-7">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">{eyebrow}</p>
            <h2 className="mt-2 font-serif text-3xl text-foreground" id={titleId}>
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description ??
                `${dateLabel}. Notes, texture, annoyances, wins, and anything that does not fit the smaller prompts.`}
            </p>
          </div>
          <Button
            aria-label="Close writing modal"
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="rounded-[28px] border border-border/60 bg-ruled bg-[length:100%_38px] p-4 sm:p-6">
            <Textarea
              autoFocus
              className="min-h-[52vh] resize-none border-0 bg-transparent px-0 py-0 text-base leading-8 shadow-none focus-visible:ring-0"
              data-testid={testId}
              onChange={(event) => onChange(event.currentTarget.value)}
              onBlur={onTextareaBlur}
              onFocus={onTextareaFocus}
              placeholder={
                placeholder ??
                "Let the day land here. Write the parts you want to remember, untangle, or release."
              }
              value={value}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
