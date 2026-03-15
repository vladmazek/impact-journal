import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { Providers } from "@/components/providers";
import { getSessionUser } from "@/lib/auth/session";
import { toThemeMode } from "@/lib/theme";
import "@/app/globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Impact Journal",
  description: "A private, calm journaling workspace for one person.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionUser();

  return (
    <html
      className={`${sans.variable} ${serif.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <Providers themePreference={toThemeMode(session?.themePreference)}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
