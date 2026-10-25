import { RelatedRecords } from "@/components/related-records";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { resources, label } from "@/lib/domain/resources";
import { get, referenceLabels } from "@/lib/server/queries";
import { db, securityBoundaryReady } from "@/lib/server/db";
import { dateBR } from "@/lib/utils";
import { RecordActions } from "@/components/record-actions";
import { DocumentUpload } from "@/components/document-upload";
import { KitActions } from "@/components/kit-actions";
export default async function Detail({
  params,
}: {
  params: Promise<{ entity: string; id: string }>;
}) {
  const { entity, id } = await params,
    meta = resources[entity];
  if (!meta || !z.uuid().safeParse(id).success) notFound();
  let row;
  try {
    row = await get(entity, id);
  } catch {
    notFound();
  }
  const refs = await referenceLabels(
    [row],
    [...meta.fields, ...(meta.columns ?? [])],
  );
  const { data: events, error } = await db()
    .from("audit_events")
    .select("*,mechanics(name)")
    .eq("entity", entity)
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  const hardened = await securityBoundaryReady();
  const { data: versions, error: ve } =
    entity === "documents"
      ? await db()
          .from("document_versions")
          .select(
            hardened
              ? "id,revision,created_at,mime_type,size_bytes,scan_status"
              : "id,revision,created_at,mime_type,size_bytes",
          )
          .eq("document_id", id)
          .order("revision", { ascending: false })
      : { data: null, error: null };
  if (ve) throw ve;
  const versionRows = (versions ?? []) as unknown as Array<{
    id: string;
    revision: number;
    mime_type: string;
    created_at: string;
    scan_status?: string;
  }>;
  return (
    <>
      <div className="breadcrumb">
        <Link href="/dashboard">Hangar</Link>
        <span>/</span>
        <Link href={"/records/" + entity}>{meta.title}</Link>
        <span>/</span>Ficha
      </div>
      <div className="page-heading">
        <span className="eyebrow">FICHA OPERACIONAL</span>
        <h1>
          {String(
            row.name ??
              row.registration ??
              row.code ??
              row.serial_number ??
              "Detalhes do registro",
          )}
        </h1>
        <p>
          Identificador {id} · versão {row.version ?? 1}
        </p>
      </div>
      <RecordActions entity={entity} row={row} />
      {entity === "tool_kits" && <KitActions kitId={id} />}
      <div className="detail-grid">
        <section className="card">
          <h2>Dados do registro</h2>
          <dl className="detail-list">
            {Object.entries(row)
              .filter(([key]) => !["id", "version"].includes(key))
              .map(([key, value]) => (
                <div key={key}>
                  <dt>
                    {meta.fields.find((f) => f.key === key)?.label ??
                      (
                        {
                          quantity: "Quantidade física",
                          reserved: "Quantidade reservada",
                          created_at: "Criado em",
                          updated_at: "Atualizado em",
                          status: "Situação",
                          logistics: "Situação logística",
                          calibration_due: "Vencimento da calibração",
                          closed_at: "Encerramento administrativo",
                          aircraft_id: "Aeronave",
                          position: "Posição",
                        } as Record<string, string>
                      )[key] ??
                      key}
                  </dt>
                  <dd>
                    {value && typeof value === "object" ? (
                      <pre>{JSON.stringify(value, null, 2)}</pre>
                    ) : typeof value === "string" && /T\d\d:/.test(value) ? (
                      dateBR(value)
                    ) : (
                      (refs[key]?.[String(value)] ?? label(value))
                    )}
                  </dd>
                </div>
              ))}
          </dl>
          {["tools", "part_instances", "locations", "tool_kits"].includes(
            entity,
          ) && (
            <a
              className="button outline"
              href={`/api/labels?entity=${entity}&id=${id}`}
              target="_blank"
              rel="noreferrer"
            >
              Imprimir etiqueta / QR Code
            </a>
          )}
        </section>
        <section className="card">
          <h2>Histórico cronológico</h2>
          <p className="fine-print">
            Responsável informado, sem equivalência a assinatura técnica
            oficial. Últimos 50 eventos.
          </p>
          <ol className="timeline">
            {events?.map((event) => (
              <li key={event.id}>
                <span className="timeline-dot" />
                <strong>
                  {event.responsavel_declarado ??
                    event.mechanics?.name ??
                    "Sistema"}
                </strong>
                <time>{dateBR(event.created_at)}</time>
                <p>{event.reason || event.action}</p>
                <details>
                  <summary>Ver alterações registradas</summary>
                  <pre>
                    {JSON.stringify(
                      { antes: event.before_data, depois: event.after_data },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              </li>
            ))}
            {!events?.length && (
              <p>Nenhum evento registrado para esta ficha.</p>
            )}
          </ol>
        </section>
      </div>
      {entity === "documents" && (
        <section className="card">
          <h2>Arquivos e versões privadas</h2>
          {hardened ? (
            <DocumentUpload documentId={id} />
          ) : (
            <p className="notice" role="status">
              O envio de arquivos ainda não está disponível neste ambiente. Você
              pode cadastrar a referência do documento e vinculá-la à peça.
            </p>
          )}
          <p className="fine-print">
            Novos arquivos aguardam verificação de segurança. O download fica
            disponível somente após a liberação.
          </p>
          <ul className="document-versions" aria-live="polite">
            {versionRows.map((v) => (
              <li key={v.id}>
                {("scan_status" in v ? v.scan_status : "pending") ===
                "clean" ? (
                  <a
                    href={`/api/documents/${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Versão {v.revision} · {v.mime_type} · {dateBR(v.created_at)}
                  </a>
                ) : (
                  <span>
                    Versão {v.revision} · {v.mime_type} · {dateBR(v.created_at)}{" "}
                    <span
                      className="badge"
                      data-state={
                        ("scan_status" in v ? v.scan_status : "pending") ===
                        "rejected"
                          ? "rejected"
                          : "pending"
                      }
                    >
                      {("scan_status" in v ? v.scan_status : "pending") ===
                      "rejected"
                        ? "Bloqueado pela verificação"
                        : "Aguardando verificação de segurança"}
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <RelatedRecords entity={entity} id={id} />
      {entity === "external_shipments" && (
        <Link
          className="button outline"
          href="/records/external_shipment_items"
        >
          Consultar itens e registrar retornos
        </Link>
      )}
      {["maintenance_tasks", "work_orders"].includes(entity) && (
        <p className="notice">
          Conclusão administrativa não autoriza voo ou retorno ao serviço.
        </p>
      )}
    </>
  );
}
