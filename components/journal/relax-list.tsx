"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RelaxListProps = {
  items: string[];
  onChange: (items: string[]) => void;
};

function trimTrailingBlankItems(items: string[]) {
  const nextItems = [...items];

  while (nextItems.length > 0 && nextItems[nextItems.length - 1]?.trim() === "") {
    nextItems.pop();
  }

  return nextItems;
}

export function RelaxList({ items, onChange }: RelaxListProps) {
  const visibleItems = items.length > 0 ? items : [""];
  const canAddItem =
    trimTrailingBlankItems(items).length < 5 &&
    visibleItems.every((item) => item.trim().length > 0);

  return (
    <div className="space-y-3">
      {visibleItems.map((item, index) => (
        <div className="flex items-center gap-3" key={`${index}-${item}`}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70 text-xs font-medium text-muted-foreground">
            {index + 1}
          </span>
          <Input
            onBlur={() => {
              const normalizedItems = trimTrailingBlankItems(items).slice(0, 5);
              onChange(normalizedItems.length > 0 ? normalizedItems : [""]);
            }}
            onChange={(event) => {
              const nextItems = [...visibleItems];
              nextItems[index] = event.currentTarget.value;
              onChange(nextItems.slice(0, 5));
            }}
            placeholder={`A small reset for later #${index + 1}`}
            value={item}
          />
          <Button
            aria-label={`Remove relax item ${index + 1}`}
            onClick={() => {
              const nextItems = visibleItems.filter((_, itemIndex) => itemIndex !== index);
              onChange(nextItems.length > 0 ? nextItems : [""]);
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
        onClick={() => onChange([...trimTrailingBlankItems(visibleItems), ""])}
        type="button"
        variant="outline"
      >
        <Plus className="h-4 w-4" />
        Add relax idea
      </Button>
    </div>
  );
}
