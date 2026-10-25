"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Worker } from "tesseract.js";
import { identifiersFromText } from "@/lib/domain/part-ocr";
import { preparePhoto } from "@/lib/photo";
import { useHydrated } from "@/lib/use-hydrated";
import { usePhotoDraft } from "./photo-draft";
export function PartOcr() {
  const ready = useHydrated();
  const { setDraft } = usePhotoDraft();
  const worker = useRef<Worker | null>(null),
    generation = useRef(0),
    preview = useRef<HTMLImageElement>(null);
  const [image, setImage] = useState<File>(),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState("");
  const [partNumber, setPartNumber] = useState(""),
    [serialNumber, setSerialNumber] = useState(""),
    [text, setText] = useState("");
  useEffect(
    () => () => {
      generation.current++;
      void worker.current?.terminate().catch(() => {});
      worker.current = null;
    },
    [],
  );
  useEffect(() => {
    const element = preview.current;
    if (!image || !element) return;
    const url = URL.createObjectURL(image);
    element.src = url;
    return () => {
      element.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [image]);
  async function read(file?: File) {
    if (!file || busy) return;
    setDraft(null);
    const current = ++generation.current;
    setBusy(true);
    setProgress(0);
    setError("");
    setText("");
    setPartNumber("");
    setSerialNumber("");
    setImage(undefined);
    let active: Worker | undefined;
    try {
      const photo = await preparePhoto(file);
      if (current !== generation.current) return;
      setImage(photo);
      const { createWorker } = await import("tesseract.js");
      if (current !== generation.current) return;
      active = await createWorker(["eng", "por"], 1, {
        workerPath: window.location.origin + "/ocr/v7/worker.min.js",
        corePath: window.location.origin + "/ocr/v7/core",
        langPath: window.location.origin + "/ocr/v7/lang",
        workerBlobURL: false,
        logger: (event) => {
          if (current === generation.current)
            setProgress(
              Math.round(Math.min(1, Math.max(0, event.progress || 0)) * 100),
            );
        },
        errorHandler: () => {},
      });
      if (current !== generation.current) return;
      worker.current = active;
      const { data } = await active.recognize(photo);
      if (current !== generation.current) return;
      const result = identifiersFromText(data.text);
      setText(data.text);
      setPartNumber(result.partNumber);
      setSerialNumber(result.serialNumber);
      if (!result.partNumber || !result.serialNumber)
        setError(
          "Não consegui identificar os dois campos com segurança. Confira o texto e preencha o que faltar.",
        );
    } catch {
      if (current === generation.current)
        setError(
          "Não foi possível ler a foto. Use uma imagem nítida de frente para a etiqueta ou documento e confira os campos manualmente.",
        );
    } finally {
      await active?.terminate().catch(() => {});
      if (worker.current === active) worker.current = null;
      if (current === generation.current) setBusy(false);
    }
  }
  const query = new URLSearchParams({
    part_number: partNumber.trim(),
    serial_number: serialNumber.trim(),
  }).toString();
  return (
    <section className="card stack">
      <h2>Ler PN e serial da foto</h2>
      <p>
        Fotografe a identificação da peça ou o documento. Confira o P/N e o S/N
        sugeridos antes de continuar o cadastro.
      </p>
      <p className="fine-print">
        A leitura ocorre neste aparelho, sem enviar a foto a serviços externos.
        A foto não é anexada automaticamente ao cadastro; o envio de documentos
        é confirmado separadamente.
      </p>
      <label>
        Tirar foto para ler PN e serial
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={!ready || busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            void read(file);
          }}
        />
      </label>
      <label>
        Selecionar foto do documento
        <input
          type="file"
          accept="image/*"
          disabled={!ready || busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            void read(file);
          }}
        />
      </label>
      {image && (
        // Local blob preview only; never passed to an image proxy.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={preview}
          alt="Foto usada para leitura de PN e serial"
          style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
        />
      )}
      {busy && <p role="status">Lendo foto no aparelho… {progress}%</p>}
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <p className="fine-print">
        Confira PN e serial com o original antes de continuar. A leitura pode
        confundir 0/O e 1/I.
      </p>
      <label>
        Part Number (conferir)
        <input
          value={partNumber}
          onChange={(event) => setPartNumber(event.target.value)}
          maxLength={100}
          disabled={busy}
          autoComplete="off"
        />
      </label>
      <label>
        Serial Number (conferir)
        <input
          value={serialNumber}
          onChange={(event) => setSerialNumber(event.target.value)}
          maxLength={100}
          disabled={busy}
          autoComplete="off"
        />
      </label>
      {!busy && partNumber.trim() && serialNumber.trim() && (
        <Link
          className="button"
          href={"/records/part_instances?" + query}
          onClick={() =>
            setDraft(
              image
                ? {
                    file: image,
                    partNumber: partNumber.trim(),
                    serialNumber: serialNumber.trim(),
                  }
                : null,
            )
          }
        >
          Usar PN e serial no cadastro
        </Link>
      )}
      {text && (
        <details>
          <summary>Conferir texto reconhecido</summary>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {text}
          </pre>
        </details>
      )}
    </section>
  );
}
