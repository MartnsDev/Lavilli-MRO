"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Keyboard } from "lucide-react";
import { Button } from "./ui/button";
type Detector = {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};
type DetectorConstructor = new (options: { formats: string[] }) => Detector;
export function QrScanner() {
  const router = useRouter(),
    video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(false),
    [error, setError] = useState("");
  function stop() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (timer.current) clearTimeout(timer.current);
    setActive(false);
  }
  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function openCode(code: string) {
    try {
      const url = new URL(code, window.location.origin);
      if (
        url.origin === window.location.origin &&
        /^\/records\/(tools|tool_kits|locations|part_instances)\/[a-f0-9-]{36}$/.test(
          url.pathname,
        )
      ) {
        stop();
        router.push(url.pathname);
        return;
      }
    } catch {}
    stop();
    router.push("/search?q=" + encodeURIComponent(code.slice(0, 100)));
  }
  async function start() {
    setError("");
    const DetectorClass = (
      window as unknown as { BarcodeDetector?: DetectorConstructor }
    ).BarcodeDetector;
    if (!DetectorClass || !navigator.mediaDevices?.getUserMedia) {
      setError(
        "Leitura pela câmera indisponível neste navegador. Use a busca por código abaixo.",
      );
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      stream.current = media;
      if (!video.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      video.current.srcObject = media;
      await video.current.play();
      const detector = new DetectorClass({ formats: ["qr_code"] });
      setActive(true);
      async function scan() {
        if (!stream.current || !video.current) return;
        try {
          const codes = await detector.detect(video.current);
          if (codes[0]) {
            openCode(codes[0].rawValue);
            return;
          }
        } catch {
          setError(
            "Não foi possível ler a imagem. Ajuste a câmera ou digite o código.",
          );
        }
        timer.current = setTimeout(() => void scan(), 250);
      }
      void scan();
    } catch {
      stop();
      setError(
        "A câmera não foi autorizada ou não está disponível. Use a busca manual.",
      );
    }
  }
  return (
    <div className="card stack">
      <h2>
        <Camera size={20} /> Ler etiqueta do hangar
      </h2>
      <p className="fine-print">
        A câmera é utilizada somente para ler o QR Code. Nenhuma imagem é
        armazenada ou enviada.
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
      {active ? (
        <Button variant="outline" onClick={stop}>
          Encerrar câmera
        </Button>
      ) : (
        <Button onClick={() => void start()}>
          <Camera size={18} /> Iniciar câmera
        </Button>
      )}
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          openCode(String(f.get("code")).trim());
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
