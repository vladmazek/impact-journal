"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type FlushHandler = () => Promise<boolean>;

export type TopbarSaveStatus = {
  badge: string | null;
  body: string;
  label: string;
  tone: "danger" | "muted" | "primary" | "success" | "warning";
};

type JournalRuntimeContextValue = {
  currentHref: string;
  isNavigating: boolean;
  pendingNavigationLabel: string | null;
  navigateToHref: (
    nextHref: string,
    options?: {
      pendingLabel?: string;
    },
  ) => Promise<boolean>;
  navigateToDate: (nextDate: string) => Promise<boolean>;
  registerFlushHandler: (handler: FlushHandler | null) => () => void;
  setTopbarSaveStatus: (status: TopbarSaveStatus | null) => void;
  topbarSaveStatus: TopbarSaveStatus | null;
};

const JournalRuntimeContext = createContext<JournalRuntimeContextValue | null>(null);

type JournalRuntimeProviderProps = {
  children: ReactNode;
  currentHref: string;
};

export function JournalRuntimeProvider({
  children,
  currentHref,
}: JournalRuntimeProviderProps) {
  const router = useRouter();
  const flushHandlerRef = useRef<FlushHandler | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<{
    label: string | null;
  } | null>(null);
  const [topbarSaveStatus, setTopbarSaveStatus] = useState<TopbarSaveStatus | null>(null);

  useEffect(() => {
    setPendingNavigation(null);
    setTopbarSaveStatus(null);
  }, [currentHref]);

  const registerFlushHandler = useCallback((handler: FlushHandler | null) => {
    flushHandlerRef.current = handler;

    return () => {
      if (flushHandlerRef.current === handler) {
        flushHandlerRef.current = null;
      }
    };
  }, []);

  const navigateToHref = useCallback(
    async (
      nextHref: string,
      options: {
        pendingLabel?: string;
      } = {},
    ) => {
      if (!nextHref || nextHref === currentHref) {
        return true;
      }

      if (pendingNavigation) {
        return false;
      }

      setPendingNavigation({
        label: options.pendingLabel ?? null,
      });

      try {
        const canNavigate = flushHandlerRef.current
          ? await flushHandlerRef.current()
          : true;

        if (!canNavigate) {
          setPendingNavigation(null);
          return false;
        }

        startTransition(() => {
          router.push(nextHref);
        });

        return true;
      } catch {
        setPendingNavigation(null);
        return false;
      }
    },
    [currentHref, pendingNavigation, router],
  );

  const navigateToDate = useCallback(
    async (nextDate: string) => {
      return navigateToHref(`/entry/${nextDate}`, {
        pendingLabel: nextDate,
      });
    },
    [navigateToHref],
  );

  const value = useMemo(
    () => ({
      currentHref,
      isNavigating: pendingNavigation !== null,
      navigateToHref,
      navigateToDate,
      pendingNavigationLabel: pendingNavigation?.label ?? null,
      registerFlushHandler,
      setTopbarSaveStatus,
      topbarSaveStatus,
    }),
    [
      currentHref,
      navigateToDate,
      navigateToHref,
      pendingNavigation,
      registerFlushHandler,
      topbarSaveStatus,
    ],
  );

  return (
    <JournalRuntimeContext.Provider value={value}>
      {children}
    </JournalRuntimeContext.Provider>
  );
}

export function useJournalRuntime() {
  const context = useContext(JournalRuntimeContext);

  if (!context) {
    throw new Error("useJournalRuntime must be used within a JournalRuntimeProvider.");
  }

  return context;
}

export function useOptionalJournalRuntime() {
  return useContext(JournalRuntimeContext);
}
