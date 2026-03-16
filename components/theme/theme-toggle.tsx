"use client";

import { Check, LaptopMinimal, MoonStar, SunMedium, SunMoon } from "lucide-react";
import { startTransition, useState } from "react";
import { useTheme } from "next-themes";

import { updateThemePreferenceAction } from "@/lib/actions/auth";
import { type ThemeMode } from "@/lib/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const options: Array<{
  description: string;
  icon: typeof SunMedium;
  label: string;
  value: ThemeMode;
}> = [
  {
    value: "light",
    label: "Light",
    description: "Clean paper tones",
    icon: SunMedium,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Low-glare night writing",
    icon: MoonStar,
  },
  {
    value: "system",
    label: "System",
    description: "Follow this device",
    icon: LaptopMinimal,
  },
];

type ThemeToggleProps = {
  currentPreference: ThemeMode;
  persistPreference?: boolean;
  variant?: "dropdown" | "inline";
};

export function ThemeToggle({
  currentPreference,
  persistPreference = false,
  variant = "dropdown",
}: ThemeToggleProps) {
  const { setTheme } = useTheme();
  const [selected, setSelected] = useState<ThemeMode>(currentPreference);
  const [isPending, setIsPending] = useState(false);

  const activeOption = options.find((option) => option.value === selected) ?? options[2];

  const handleSelect = (value: ThemeMode) => {
    setSelected(value);
    setTheme(value);

    if (!persistPreference) {
      return;
    }

    setIsPending(true);
    startTransition(async () => {
      await updateThemePreferenceAction(value);
      setIsPending(false);
    });
  };

  if (variant === "inline") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {options.map((option) => {
            const Icon = option.icon;
            const isActive = selected === option.value;

            return (
              <button
                aria-label={`Use ${option.label.toLowerCase()} theme`}
                aria-pressed={isActive}
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full border transition",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                    : "border-border/70 bg-background/80 text-muted-foreground hover:border-primary/20 hover:text-foreground",
                )}
                disabled={isPending}
                key={option.value}
                onClick={() => handleSelect(option.value)}
                title={option.label}
                type="button"
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {isPending
            ? "Saving your preference..."
            : `Current mode: ${activeOption.label.toLowerCase()}.`}
        </p>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Change theme"
          className="rounded-full"
          size="icon"
          variant="outline"
        >
          <SunMoon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        {options.map((option) => {
          const Icon = option.icon;

          return (
            <DropdownMenuItem
              className="flex items-center gap-3"
              key={option.value}
              onSelect={() => handleSelect(option.value)}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/70">
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </span>
              {selected === option.value ? <Check className="h-4 w-4 text-primary" /> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {isPending
            ? "Saving your preference..."
            : `Current mode: ${activeOption.label.toLowerCase()}.`}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
