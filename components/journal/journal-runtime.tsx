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

type JournalRuntimeContextValue = {
  currentDate: string;
  isNavigating: boolean;
  pendingDate: string | null;
  navigateToDate: (nextDate: string) => Promise<boolean>;
  registerFlushHandler: (handler: FlushHandler | null) => () => void;
};

const JournalRuntimeContext = createContext<JournalRuntimeContextValue | null>(null);

type JournalRuntimeProviderProps = {
  children: ReactNode;
  currentDate: string;
};

export function JournalRuntimeProvider({
  children,
  currentDate,
}: JournalRuntimeProviderProps) {
  const router = useRouter();
  const flushHandlerRef = useRef<FlushHandler | null>(null);
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  useEffect(() => {
    setPendingDate(null);
  }, [currentDate]);

  const registerFlushHandler = useCallback((handler: FlushHandler | null) => {
    flushHandlerRef.current = handler;

    return () => {
      if (flushHandlerRef.current === handler) {
        flushHandlerRef.current = null;
      }
    };
  }, []);

  const navigateToDate = useCallback(
    async (nextDate: string) => {
      if (!nextDate || nextDate === currentDate) {
        return true;
      }

      if (pendingDate) {
        return false;
      }

      setPendingDate(nextDate);

      try {
        const canNavigate = flushHandlerRef.current
          ? await flushHandlerRef.current()
          : true;

        if (!canNavigate) {
          setPendingDate(null);
          return false;
        }

        startTransition(() => {
          router.push(`/entry/${nextDate}`);
        });

        return true;
      } catch {
        setPendingDate(null);
        return false;
      }
    },
    [currentDate, pendingDate, router],
  );

  const value = useMemo(
    () => ({
      currentDate,
      isNavigating: pendingDate !== null,
      navigateToDate,
      pendingDate,
      registerFlushHandler,
    }),
    [currentDate, navigateToDate, pendingDate, registerFlushHandler],
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
