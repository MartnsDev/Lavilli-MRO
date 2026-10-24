"use client";
import { useState } from "react";
import { OperationForm } from "./operation-form";
export function DocumentUpload({ documentId }: { documentId: string }) {
  const [file, setFile] = useState<File>(),
    [hash, setHash] = useState(""),
    [error, setError] = useState("");
  return (
    <div className="stack">
      <label>
        Nova versão (PDF, PNG ou JPEG; até 4 MB)
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          onChange={async (e) => {
            setHash("");
            setError("");
            const f = e.target.files?.[0];
            setFile(f);
            if (!f) return;
            if (f.size > 4 * 1024 * 1024) {
              setError("O arquivo excede 4 MB.");
              return;
            }
            const bytes = await f.arrayBuffer();
            const digest = await crypto.subtle.digest("SHA-256", bytes);
            setHash(
              Array.from(new Uint8Array(digest))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join(""),
            );
          }}
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {file && hash && (
        <OperationForm
          title="Adicionar versão privada"
          command={{
            action: "document_version",
            data: {
              document_id: documentId,
              sha256: hash,
              mime_type: file.type,
              size_bytes: file.size,
            },
          }}
          execute={async (payload) => {
            const form = new FormData();
            form.set("file", file);
            form.set("payload", JSON.stringify(payload));
            const r = await fetch("/api/documents/upload", {
              method: "POST",
              body: form,
            });
            const b = await r.json();
            if (!r.ok) throw Error(b.error);
          }}
          onSuccess={() => {
            setFile(undefined);
            setHash("");
          }}
        />
      )}
      <p className="fine-print">
        Extensão, tipo e assinatura do arquivo são conferidos no servidor.
        Versões anteriores são preservadas.
      </p>
    </div>
  );
}
