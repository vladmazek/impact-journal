import { ThemePreference } from "@prisma/client";

export type ThemeMode = "light" | "dark" | "system";

export function toThemeMode(
  value: ThemePreference | ThemeMode | null | undefined,
): ThemeMode {
  switch (value) {
    case ThemePreference.LIGHT:
    case "light":
      return "light";
    case ThemePreference.DARK:
    case "dark":
      return "dark";
    default:
      return "system";
  }
}

export function toThemePreference(mode: ThemeMode): ThemePreference {
  switch (mode) {
    case "light":
      return ThemePreference.LIGHT;
    case "dark":
      return ThemePreference.DARK;
    default:
      return ThemePreference.SYSTEM;
  }
}

