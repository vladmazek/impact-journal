"use client";

import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { getMediaUrl } from "@/lib/media-url";
import { Button } from "@/components/ui/button";
import type { ImageAttachmentRecord } from "@/lib/journal/daily-entry-shared";

type ImagePreviewModalProps = {
  image: ImageAttachmentRecord | null;
  onClose: () => void;
};

export function ImagePreviewModal({
  image,
  onClose,
}: ImagePreviewModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!image) {
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
  }, [image, onClose]);

  if (!isMounted || !image) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        aria-label="Close image preview"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none border border-border/60 bg-card/95 shadow-journal sm:h-auto sm:max-h-[92vh] sm:rounded-[32px]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
              Image preview
            </p>
            <h2 className="mt-2 truncate font-serif text-2xl text-foreground sm:text-3xl" id={titleId}>
              {image.originalFilename}
            </h2>
          </div>
          <Button
            aria-label="Close image preview"
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-muted/20 px-4 py-4 sm:px-8 sm:py-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={image.originalFilename}
            className="max-h-full w-auto max-w-full rounded-[24px] border border-border/50 bg-background object-contain shadow-lg"
            src={getMediaUrl(image.relativePath)}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
