"use client";

import { Check, LaptopMinimal, MoonStar, Palette, SunMedium } from "lucide-react";
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
};

export function ThemeToggle({
  currentPreference,
  persistPreference = false,
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Change theme"
          className="rounded-full"
          size="icon"
          variant="outline"
        >
          <Palette className="h-4 w-4" />
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

