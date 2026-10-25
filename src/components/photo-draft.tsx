"use client";
import { createContext, useContext, useEffect, useState } from "react";
type PhotoDraft = { file: File; partNumber: string; serialNumber: string };
const Context = createContext<{
  draft: PhotoDraft | null;
  setDraft: (value: PhotoDraft | null) => void;
}>({ draft: null, setDraft: () => {} });
export function PhotoDraftProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [draft, setDraft] = useState<PhotoDraft | null>(null);
  useEffect(() => {
    if (!draft) return;
    const timer = setTimeout(() => setDraft(null), 15 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [draft]);
  return (
    <Context.Provider value={{ draft, setDraft }}>{children}</Context.Provider>
  );
}
export function usePhotoDraft() {
  return useContext(Context);
}
