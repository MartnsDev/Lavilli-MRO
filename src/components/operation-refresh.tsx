"use client";
import { createContext, useCallback, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";
const Context = createContext<{
  refreshing: boolean;
  refresh: () => void;
} | null>(null);
export function OperationRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter(),
    [refreshing, startTransition] = useTransition();
  const refresh = useCallback(
    () => startTransition(() => router.refresh()),
    [router],
  );
  return (
    <Context.Provider value={{ refreshing, refresh }}>
      {children}
    </Context.Provider>
  );
}
export function useOperationRefresh() {
  return useContext(Context);
}
