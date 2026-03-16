import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EntrySectionProps = {
  children: ReactNode;
  className?: string;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function EntrySection({
  children,
  className,
  description,
  eyebrow,
  title,
}: EntrySectionProps) {
  return (
    <Card className={cn("overflow-hidden border-border/60 bg-card/85", className)}>
      <CardHeader className="border-b border-border/50 pb-5">
        {eyebrow ? (
          <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
            {eyebrow}
          </p>
        ) : null}
        <CardTitle>{title}</CardTitle>
        {description ? (
          <CardDescription className="max-w-2xl text-sm leading-6">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}
