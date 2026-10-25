"use client";
import Link from "next/link";
import { useState } from "react";
import { OperationForm } from "./operation-form";
import { DocumentUpload } from "./document-upload";
import { resources } from "@/lib/domain/resources";
export function PartDocumentCapture({
  partId,
  partNumber,
  serialNumber,
  uploadsReady,
}: {
  partId: string;
  partNumber: string;
  serialNumber: string;
  uploadsReady: boolean;
}) {
  const [documentId, setDocumentId] = useState(""),
    [linked, setLinked] = useState(false),
    [error, setError] = useState("");
  return (
    <section className="card stack">
      <h2>Foto e documento desta peça</h2>
      <p>
        P/N <strong>{partNumber || "Consultar catálogo"}</strong> · S/N{" "}
        <strong>{serialNumber}</strong>
      </p>
      <p className="fine-print">
        Cadastre a identificação do documento, confirme o vínculo com esta
        unidade e fotografe ou use a foto da leitura. Nenhum identificador
        precisa ser copiado.
      </p>
      {!documentId && (
        <OperationForm
          title="Cadastrar documento desta peça"
          fields={resources.documents.fields}
          initial={{
            name: `Documento · ${partNumber} · S/N ${serialNumber}`,
            category: "internal",
          }}
          command={{ action: "create", entity: "documents" }}
          onSuccess={(value) => {
            const id =
              value && typeof value === "object" && "id" in value
                ? value.id
                : undefined;
            if (typeof id === "string" && /^[a-f0-9-]{36}$/i.test(id))
              setDocumentId(id);
            else
              setError(
                "O cadastro foi enviado, mas não foi possível identificar o documento. Consulte Documentos antes de repetir.",
              );
          }}
        />
      )}
      {documentId && !linked && (
        <>
          <p>
            Documento cadastrado. Confirme o vínculo com esta peça antes de
            enviar a foto.
          </p>
          <OperationForm
            title="Confirmar vínculo do documento"
            command={{
              action: "create",
              entity: "document_links",
              data: {
                document_id: documentId,
                entity: "part_instances",
                entity_id: partId,
              },
            }}
            onSuccess={() => setLinked(true)}
          />
        </>
      )}
      {documentId &&
        linked &&
        (uploadsReady ? (
          <DocumentUpload
            documentId={documentId}
            expectedPart={{ partNumber, serialNumber }}
          />
        ) : (
          <p className="notice">
            O documento foi vinculado. O envio de arquivos aguarda a
            configuração do servidor.
          </p>
        ))}
      {documentId && (
        <Link className="record-link" href={"/records/documents/" + documentId}>
          Ver documento e versões
        </Link>
      )}
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
    </section>
  );
}
