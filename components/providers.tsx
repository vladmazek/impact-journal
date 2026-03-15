"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import type { ThemeMode } from "@/lib/theme";

type ProvidersProps = {
  children: ReactNode;
  themePreference: ThemeMode;
};

export function Providers({ children, themePreference }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={themePreference}
      enableSystem
      disableTransitionOnChange
      storageKey="impact-journal-theme"
    >
      {children}
    </ThemeProvider>
  );
}

