"use client";
import { useEffect, useRef, useState } from "react";
import { OperationForm } from "./operation-form";
import { useHydrated } from "@/lib/use-hydrated";
import { preparePhoto } from "@/lib/photo";
import { usePhotoDraft } from "./photo-draft";
export function DocumentUpload({
  documentId,
  expectedPart,
}: {
  documentId: string;
  expectedPart?: { partNumber: string; serialNumber: string };
}) {
  const ready = useHydrated();
  const { draft, setDraft } = usePhotoDraft();
  const draftMatches =
    !expectedPart ||
    !draft ||
    (draft.serialNumber === expectedPart.serialNumber &&
      draft.partNumber.toUpperCase() === expectedPart.partNumber.toUpperCase());
  const [uploaded, setUploaded] = useState(false);
  const selection = useRef(0);
  const input = useRef<HTMLInputElement>(null),
    camera = useRef<HTMLInputElement>(null);
  const preview = useRef<HTMLImageElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [file, setFile] = useState<File>(),
    [hash, setHash] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    const element = preview.current;
    if (!file?.type.startsWith("image/") || !element) return;
    const url = URL.createObjectURL(file);
    element.src = url;
    return () => {
      element.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [file]);
  useEffect(
    () => () => {
      selection.current++;
    },
    [],
  );
  async function selectFile(selected?: File, photo = false) {
    setUploaded(false);
    const current = ++selection.current;
    setHash("");
    setError("");
    setFile(undefined);
    setPreparing(Boolean(selected));
    if (!selected) return;
    try {
      const next = photo ? await preparePhoto(selected) : selected;
      if (next.size > 4 * 1024 * 1024)
        throw Error(
          "O arquivo excede 4 MB. Para fotos, use Tirar foto do documento para prepará-las.",
        );
      if (!["application/pdf", "image/png", "image/jpeg"].includes(next.type))
        throw Error("Escolha PDF, PNG ou JPEG.");
      const digest = await crypto.subtle.digest(
        "SHA-256",
        await next.arrayBuffer(),
      );
      if (current !== selection.current) return;
      setFile(next);
      setHash(
        Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
      );
    } catch (e) {
      if (current === selection.current)
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível preparar o arquivo. Tente uma foto JPEG ou PNG.",
        );
    } finally {
      if (current === selection.current) setPreparing(false);
    }
  }
  return (
    <div className="stack">
      {draft && (
        <div className="notice stack">
          <p>
            Foto da leitura disponível: P/N {draft.partNumber} · S/N{" "}
            {draft.serialNumber}. Confira se este é o documento da unidade
            correta.
          </p>
          <button
            type="button"
            className="button outline"
            disabled={!ready || preparing || !draftMatches}
            onClick={() => void selectFile(draft.file)}
          >
            Usar foto da leitura
          </button>
        </div>
      )}
      <label>
        Nova versão (PDF, PNG ou JPEG; até 4 MB)
        <input
          type="file"
          ref={input}
          disabled={!ready || preparing}
          accept="application/pdf,image/png,image/jpeg"
          onChange={(e) => void selectFile(e.target.files?.[0])}
        />
      </label>
      <label>
        Tirar foto do documento
        <input
          ref={camera}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={!ready || preparing}
          onChange={(e) => void selectFile(e.target.files?.[0], true)}
        />
      </label>
      <p className="fine-print">
        A foto é preparada em JPEG, com até 3.000 pixels no lado maior e sem
        metadados de localização. Confira a legibilidade antes de confirmar o
        envio.
      </p>
      {preparing && <p role="status">Preparando arquivo…</p>}
      {!draftMatches && (
        <p className="notice">
          A foto da leitura está identificada para outra peça ou serial.
          Selecione ou fotografe o documento correto desta unidade.
        </p>
      )}
      {uploaded && (
        <p role="status">
          Arquivo enviado e salvo. Confira a situação da verificação no
          documento e suas versões.
        </p>
      )}
      {file?.type.startsWith("image/") && (
        // A local blob preview must not go through image optimization or leave this device.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={preview}
          alt="Prévia da foto do documento"
          style={{ maxWidth: "100%", maxHeight: 420, objectFit: "contain" }}
        />
      )}
      {file && (
        <p className="fine-print">
          {file.name} · {Math.ceil(file.size / 1024)} KB · aguardando
          confirmação de envio
        </p>
      )}
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
            setUploaded(true);
            if (file === draft?.file) setDraft(null);
            selection.current++;
            if (input.current) input.current.value = "";
            if (camera.current) camera.current.value = "";
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
