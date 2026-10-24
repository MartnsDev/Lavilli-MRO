import { QrScanner } from "@/components/qr-scanner";
export default function Scan() {
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">MOBILIDADE NO HANGAR</span>
        <h1>Leitor de etiquetas</h1>
        <p>
          Abra uma ficha autenticada pela câmera ou informe o código
          manualmente.
        </p>
      </div>
      <QrScanner />
    </>
  );
}
