"use client";
import { Dialog as Primitive } from "radix-ui";
import { useRef } from "react";
import { X } from "lucide-react";
export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogTitle = Primitive.Title;
export const DialogDescription = Primitive.Description;
export function DialogContent({ children }: { children: React.ReactNode }) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="dialog-overlay" />
      <Primitive.Content
        className="dialog-content"
        onOpenAutoFocus={() => {
          opener.current = document.activeElement as HTMLElement;
        }}
        onCloseAutoFocus={(event) => {
          if (opener.current?.isConnected) {
            event.preventDefault();
            opener.current.focus();
          }
        }}
      >
        {children}
        <Primitive.Close className="dialog-close" aria-label="Fechar">
          <X size={20} />
        </Primitive.Close>
      </Primitive.Content>
    </Primitive.Portal>
  );
}
