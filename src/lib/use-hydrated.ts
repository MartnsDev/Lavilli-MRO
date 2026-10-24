"use client";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
// Keep native file pickers disabled until their change handlers are attached.
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
