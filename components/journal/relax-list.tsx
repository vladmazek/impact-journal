"use client";

import { useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RelaxListProps = {
  items: string[];
  onChange: (items: string[]) => void;
  onCommit: (items: string[]) => void;
  onFocusItem?: (index: number) => void;
};

function trimTrailingBlankItems(items: string[]) {
  const nextItems = [...items];

  while (nextItems.length > 0 && nextItems[nextItems.length - 1]?.trim() === "") {
    nextItems.pop();
  }

  return nextItems;
}

export function RelaxList({ items, onChange, onCommit, onFocusItem }: RelaxListProps) {
  const visibleItems = items.length > 0 ? items : [""];
  const canAddItem =
    trimTrailingBlankItems(items).length < 5 &&
    visibleItems.every((item) => item.trim().length > 0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const pendingFocusIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocusIndexRef.current === null) {
      return;
    }

    const input = inputRefs.current[pendingFocusIndexRef.current];

    if (!input) {
      return;
    }

    input.focus();
    pendingFocusIndexRef.current = null;
  }, [visibleItems.length]);

  const appendItemAndFocus = (baseItems: string[]) => {
    const trimmedItems = trimTrailingBlankItems(baseItems).slice(0, 5);

    if (trimmedItems.length >= 5) {
      return;
    }

    const nextItems = [...trimmedItems, ""];
    pendingFocusIndexRef.current = nextItems.length - 1;
    onChange(nextItems);
  };

  return (
    <div className="space-y-3">
      {visibleItems.map((item, index) => (
        <div className="flex items-center gap-3" key={index}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70 text-xs font-medium text-muted-foreground">
            {index + 1}
          </span>
          <Input
            onBlur={(event) => {
              const nextFocusedElement = event.relatedTarget;
              const isMovingToAnotherRelaxInput =
                nextFocusedElement instanceof HTMLInputElement &&
                inputRefs.current.includes(nextFocusedElement);

              if (isMovingToAnotherRelaxInput || pendingFocusIndexRef.current !== null) {
                return;
              }

              const normalizedItems = trimTrailingBlankItems(items).slice(0, 5);
              const nextItems = normalizedItems.length > 0 ? normalizedItems : [""];
              onChange(nextItems);
              onCommit(nextItems);
            }}
            onChange={(event) => {
              const nextItems = [...visibleItems];
              nextItems[index] = event.currentTarget.value;
              onChange(nextItems.slice(0, 5));
            }}
            onFocus={() => onFocusItem?.(index)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey) {
                return;
              }

              event.preventDefault();

              const trimmedItems = trimTrailingBlankItems(visibleItems);
              const hasNextFilledItem = index < trimmedItems.length - 1;

              if (hasNextFilledItem) {
                inputRefs.current[index + 1]?.focus();
                return;
              }

              if (event.currentTarget.value.trim().length === 0) {
                return;
              }

              appendItemAndFocus(visibleItems);
            }}
            placeholder={`A small reset for later #${index + 1}`}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            value={item}
          />
          <Button
            aria-label={`Remove relax item ${index + 1}`}
            onClick={() => {
              const nextItems = visibleItems.filter((_, itemIndex) => itemIndex !== index);
              const committedItems = nextItems.length > 0 ? nextItems : [""];
              onChange(committedItems);
              onCommit(committedItems);
            }}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        className="rounded-full"
        disabled={!canAddItem}
        onClick={() => {
          appendItemAndFocus(visibleItems);
        }}
        type="button"
        variant="outline"
      >
        <Plus className="h-4 w-4" />
        Add relax idea
      </Button>
    </div>
  );
}
