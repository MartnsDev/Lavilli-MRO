"use client";
import { useState } from "react";
export function PrivatePhoto({ versionId }: { versionId: string }) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState(false);
  return (
    <details
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
        setError(false);
      }}
    >
      <summary>Visualizar foto verificada</summary>
      {open && !error && (
        // Private images must keep authentication cookies and must never use a public image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={"/api/documents/" + versionId}
          alt="Foto do documento após verificação de segurança"
          style={{ maxWidth: "100%", maxHeight: 640, objectFit: "contain" }}
          onError={() => setError(true)}
        />
      )}
      {error && (
        <p role="alert">
          Não foi possível abrir a foto. Confira a conexão e entre novamente se
          a sessão expirou.
        </p>
      )}
    </details>
  );
}
