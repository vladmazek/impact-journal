"use client";

import {
  forwardRef,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";

import { useOptionalJournalRuntime } from "@/components/journal/journal-runtime";

type GuardedLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  children: ReactNode;
  href: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  pendingLabel?: string;
};

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  );
}

export const GuardedLink = forwardRef<HTMLAnchorElement, GuardedLinkProps>(
  ({ children, href, onClick, pendingLabel, ...props }, ref) => {
    const journalRuntime = useOptionalJournalRuntime();

    return (
      <Link
        href={href}
        onClick={(event) => {
          onClick?.(event);

          if (!journalRuntime || !isPlainLeftClick(event)) {
            return;
          }

          event.preventDefault();
          void journalRuntime.navigateToHref(href, {
            pendingLabel,
          });
        }}
        {...props}
        ref={ref}
      >
        {children}
      </Link>
    );
  },
);

GuardedLink.displayName = "GuardedLink";
