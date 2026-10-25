"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Keyboard } from "lucide-react";
import type { IScannerControls } from "@zxing/browser";
import { Button } from "./ui/button";
import { scanDestination } from "@/lib/domain/scan";
import { preparePhoto } from "@/lib/photo";
import { useHydrated } from "@/lib/use-hydrated";

export function QrScanner() {
  const router = useRouter(),
    ready = useHydrated();
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    controls = useRef<IScannerControls | null>(null),
    generation = useRef(0);
  const [active, setActive] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const release = useCallback(() => {
    generation.current++;
    controls.current?.stop();
    controls.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  }, []);
  function stop() {
    release();
    setActive(false);
    setBusy(false);
  }
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        release();
        setActive(false);
        setBusy(false);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      release();
    };
  }, [release]);
  function openCode(code: string) {
    const destination = scanDestination(code, window.location.origin);
    if (!destination) {
      setError("Informe um código para continuar.");
      return;
    }
    stop();
    router.push(destination);
  }
  async function start() {
    stop();
    setError("");
    setBusy(true);
    const current = generation.current;
    if (!navigator.mediaDevices?.getUserMedia) {
      setBusy(false);
      setError(
        "A câmera precisa de HTTPS e permissão do navegador. Você também pode ler uma foto abaixo.",
      );
      return;
    }
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      if (current !== generation.current) return;
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
        audio: false,
      });
      if (current !== generation.current || !video.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      setActive(true);
      const reader = new BrowserMultiFormatReader();
      const scanner = await reader.decodeFromStream(
        media,
        video.current,
        (result, _error, controller) => {
          if (current !== generation.current) {
            controller.stop();
            return;
          }
          if (result) {
            controller.stop();
            openCode(result.getText());
          }
        },
      );
      if (current !== generation.current) scanner.stop();
      else {
        controls.current = scanner;
        setBusy(false);
      }
    } catch {
      if (current !== generation.current) return;
      stop();
      setError(
        "Não foi possível abrir a câmera. Permita o acesso nas configurações do navegador ou leia uma foto abaixo.",
      );
    }
  }
  async function readPhoto(file?: File) {
    if (!file) return;
    stop();
    setError("");
    setBusy(true);
    const current = generation.current;
    let url: string | undefined;
    try {
      const normalized = await preparePhoto(file);
      if (current !== generation.current) return;
      url = URL.createObjectURL(normalized);
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      if (current !== generation.current) return;
      const result = await new BrowserMultiFormatReader().decodeFromImageUrl(
        url,
      );
      if (current === generation.current) openCode(result.getText());
    } catch {
      if (current === generation.current)
        setError(
          "Não encontrei um QR Code ou código de barras legível. Aproxime a etiqueta, evite reflexos ou informe P/N e S/N na busca.",
        );
    } finally {
      if (url) URL.revokeObjectURL(url);
      if (current === generation.current) setBusy(false);
    }
  }
  return (
    <div className="card stack">
      <h2>
        <Camera size={20} /> Ler etiqueta do hangar
      </h2>
      <p className="fine-print">
        Leia QR Code ou código de barras pela câmera ou por uma foto. A leitura
        acontece neste aparelho; a imagem não é enviada nem armazenada.
      </p>
      <video
        ref={video}
        playsInline
        muted
        aria-label="Prévia da câmera para leitura QR"
        style={{
          width: "100%",
          maxHeight: 380,
          background: "#0d213c",
          borderRadius: 8,
          display: active ? "block" : "none",
        }}
      />
      {active || busy ? (
        <Button variant="outline" onClick={stop}>
          Encerrar câmera
        </Button>
      ) : (
        <Button disabled={!ready} onClick={() => void start()}>
          <Camera size={18} /> Iniciar câmera
        </Button>
      )}
      {busy && <p role="status">Preparando leitura…</p>}
      <label>
        Fotografar etiqueta
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={!ready || busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.currentTarget.value = "";
            void readPhoto(file);
          }}
        />
      </label>
      <label>
        Ler foto da galeria
        <input
          type="file"
          accept="image/*"
          disabled={!ready || busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.currentTarget.value = "";
            void readPhoto(file);
          }}
        />
      </label>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          openCode(String(new FormData(e.currentTarget).get("code") || ""));
        }}
      >
        <label>
          Código patrimonial, P/N, S/N ou endereço da etiqueta
          <input name="code" required maxLength={500} autoComplete="off" />
        </label>
        <Button variant="outline">
          <Keyboard size={18} /> Buscar código informado
        </Button>
      </form>
    </div>
  );
}
