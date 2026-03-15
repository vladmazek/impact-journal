import type { ReactNode } from "react";

export default async function JournalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
