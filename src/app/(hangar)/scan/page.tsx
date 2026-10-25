import { PartOcr } from "@/components/part-ocr";
import { QrScanner } from "@/components/qr-scanner";
export default function Scan() {
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">MOBILIDADE NO HANGAR</span>
        <h1>Leitor de etiquetas</h1>
        <p>
          Leia QR Code ou código de barras pela câmera, fotografe a etiqueta ou
          busque pelo Part Number e Serial Number.
        </p>
      </div>
      <QrScanner />
      <PartOcr />
    </>
  );
}
