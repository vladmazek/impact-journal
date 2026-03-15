"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WeekNavigationProps = {
  currentHref: string;
  isCurrentWeek: boolean;
  nextHref: string;
  previousHref: string;
};

export function WeekNavigation({
  currentHref,
  isCurrentWeek,
  nextHref,
  previousHref,
}: WeekNavigationProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-full")}
        href={previousHref}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous week
      </Link>

      <Link
        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-full")}
        href={nextHref}
      >
        Next week
        <ChevronRight className="h-4 w-4" />
      </Link>

      <Link
        className={cn(
          buttonVariants({
            size: "sm",
            variant: isCurrentWeek ? "secondary" : "ghost",
          }),
          "rounded-full",
        )}
        href={currentHref}
      >
        <Clock3 className="h-4 w-4" />
        Current week
      </Link>
    </div>
  );
}
