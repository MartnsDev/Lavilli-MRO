import Link from "next/link";
import { z } from "zod";
import { notFound } from "next/navigation";
import { ArrowUpRight, Filter, PackageOpen } from "lucide-react";
import { resources, label } from "@/lib/domain/resources";
import { list, referenceLabels } from "@/lib/server/queries";
import { RecordCreate } from "@/components/record-create";
import { db } from "@/lib/server/db";
import { dateBR, dayKeySP } from "@/lib/utils";
export default async function Records({
  params,
  searchParams,
}: {
  params: Promise<{ entity: string }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
    status?: string;
    part_number?: string;
    serial_number?: string;
    catalog_id?: string;
  }>;
}) {
  const { entity } = await params,
    meta = resources[entity];
  if (!meta) notFound();
  const raw = await searchParams;
  const pn =
    typeof raw.part_number === "string"
      ? raw.part_number.trim().slice(0, 100)
      : "";
  const sn =
    typeof raw.serial_number === "string"
      ? raw.serial_number.trim().slice(0, 100)
      : "";
  const initial: Record<string, unknown> = {};
  if (entity === "part_catalog" && pn)
    Object.assign(initial, {
      part_number: pn,
      name: "Peça " + pn,
      unit: "un",
      minimum_stock: 0,
    });
  if (entity === "part_instances" && (pn || sn)) {
    Object.assign(initial, {
      serial_number: sn,
      condition: "pending",
      documentation: "pending",
    });
    const query = db()
      .from("part_catalog")
      .select("id,part_number")
      .is("archived_at", null);
    const suppliedId =
      typeof raw.catalog_id === "string" &&
      z.uuid().safeParse(raw.catalog_id).success
        ? raw.catalog_id
        : "";
    const { data: matches, error } = await (
      suppliedId
        ? query.eq("id", suppliedId)
        : query.ilike("part_number", pn.replace(/[\\%_]/g, "\\$&"))
    ).limit(2);
    if (error) throw error;
    if (
      matches?.length === 1 &&
      (!pn ||
        matches[0].part_number.toLocaleUpperCase() === pn.toLocaleUpperCase())
    )
      initial.catalog_id = matches[0].id;
  }
  const search = {
      q: typeof raw.q === "string" ? raw.q : "",
      status: typeof raw.status === "string" ? raw.status : "",
      page: typeof raw.page === "string" ? raw.page : "1",
    },
    page = Math.max(1, Math.min(10000, Math.floor(Number(search.page)) || 1));
  const { rows, count } = await list(entity, {
    page,
    q: search.q,
    status: search.status,
  });
  const displayFields = meta.columns ?? meta.fields;
  const refs = await referenceLabels(rows, displayFields);
  const columns = displayFields.length
    ? displayFields.slice(0, 5).map((f) => ({ key: f.key, label: f.label }))
    : entity === "audit_events"
      ? [
          { key: "entity", label: "Entidade" },
          { key: "action", label: "Ação" },
          { key: "mechanic_id", label: "Responsável informado" },
          { key: "reason", label: "Motivo" },
        ]
      : [
          { key: "name", label: "Registro" },
          { key: "status", label: "Situação" },
        ];
  const extra: Record<string, string[]> = {
    part_catalog: ["part_instances"],
    stock_lots: [
      "stock_movements",
      "stock_reservations",
      "physical_counts",
      "physical_count_items",
    ],
    tools: [
      "tool_kits",
      "tool_kit_items",
      "tool_checkouts",
      "tool_inspections",
      "tool_discrepancies",
      "tool_calibrations",
    ],
    external_shipments: ["external_shipment_items", "external_tracking_events"],
    physical_counts: ["physical_count_items"],
    documents: ["document_links"],
    import_jobs: ["import_job_rows"],
    maintenance_tasks: ["activity_comments"],
    work_orders: ["activity_comments"],
  };
  return (
    <>
      <div className="breadcrumb">
        <Link href="/dashboard">Hangar</Link>
        <span>/</span>
        {meta.title}
      </div>
      <div className="page-heading heading-actions">
        <div>
          <span className="eyebrow">CONTROLE OPERACIONAL</span>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
        {meta.fields.length > 0 && (
          <RecordCreate
            key={entity + pn + sn + String(initial.catalog_id || "")}
            entity={entity}
            title={meta.title}
            fields={meta.fields}
            initial={initial}
            serialNumber={sn}
            partNumber={pn}
          />
        )}
      </div>
      {(entity === "part_catalog" || entity === "part_instances") &&
        (pn || sn) && (
          <section className="card stack">
            <p>
              Dados da leitura: P/N <strong>{pn || "não identificado"}</strong>{" "}
              · S/N <strong>{sn || "não identificado"}</strong>. Abra Novo
              cadastro e confira os campos antes de salvar.
            </p>
            {entity === "part_instances" && !initial.catalog_id && (
              <p>
                Selecione o item do catálogo. Se este P/N ainda não está
                cadastrado,{" "}
                <Link
                  className="record-link"
                  href={
                    "/records/part_catalog?" +
                    new URLSearchParams({ part_number: pn, serial_number: sn })
                  }
                >
                  cadastre primeiro o Part Number
                </Link>
                .
              </p>
            )}
          </section>
        )}

      {entity === "locations" && (
        <div className="subnav">
          <Link href="/locations">Ver árvore hierárquica →</Link>
        </div>
      )}
      {extra[entity] && (
        <div className="subnav">
          {extra[entity].map((key) => (
            <Link key={key} href={"/records/" + key}>
              {resources[key].title}
              <ArrowUpRight size={14} />
            </Link>
          ))}
        </div>
      )}
      <section className="card table-card">
        <div className="table-toolbar">
          <div>
            <strong>{count.toLocaleString("pt-BR")}</strong> registros
          </div>
          <form>
            <Filter size={17} />
            <input
              name="q"
              defaultValue={search.q}
              placeholder="Pesquisar nesta lista"
              aria-label="Pesquisar registros"
            />
            <button className="button outline small">Buscar</button>
          </form>
        </div>
        {rows.length === 0 ? (
          <div className="empty-state">
            <PackageOpen size={38} />
            <h2>
              {search.q
                ? "Nenhum resultado encontrado"
                : "Tudo pronto para começar"}
            </h2>
            <p>
              {search.q
                ? "Tente outro termo de pesquisa."
                : "Cadastre os primeiros registros para acompanhar a operação. Nenhum dado de demonstração é usado."}
            </p>
          </div>
        ) : (
          <div
            className="table-wrap"
            role="region"
            aria-label={
              "Tabela de " + meta.title + "; rolagem horizontal disponível"
            }
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  {entity === "stock_lots" && (
                    <>
                      <th>Físico</th>
                      <th>Reservado</th>
                      <th>Disponível*</th>
                    </>
                  )}
                  <th>Atualização</th>
                  <th>
                    <span className="sr-only">Detalhes</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((c, i) => (
                      <td key={c.key}>
                        {i === 0 ? (
                          <Link
                            className="record-link"
                            href={`/records/${entity}/${row.id}`}
                          >
                            {refs[c.key]?.[String(row[c.key])] ??
                              label(row[c.key] ?? row.id)}
                          </Link>
                        ) : (
                          <span
                            data-state={String(row[c.key] ?? "")}
                            className={
                              c.key === "status" || c.key === "condition"
                                ? "badge"
                                : ""
                            }
                          >
                            {refs[c.key]?.[String(row[c.key])] ??
                              label(row[c.key])}
                          </span>
                        )}
                      </td>
                    ))}
                    {entity === "stock_lots" && (
                      <>
                        <td>{String(row.quantity)}</td>
                        <td>{String(row.reserved)}</td>
                        <td>
                          {row.condition === "serviceable" &&
                          row.documentation === "complete" &&
                          (!row.expires_at ||
                            String(row.expires_at) >= dayKeySP())
                            ? Number(row.quantity) - Number(row.reserved)
                            : 0}
                        </td>
                      </>
                    )}
                    <td className="muted nowrap">
                      {dateBR(String(row.updated_at ?? row.created_at))}
                    </td>
                    <td>
                      <Link
                        aria-label="Abrir ficha"
                        href={`/records/${entity}/${row.id}`}
                      >
                        <ArrowUpRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <span>
            Página {page} de {Math.max(1, Math.ceil(count / 25))}
          </span>
          <div>
            {page > 1 && (
              <Link
                className="button outline small"
                href={`?page=${page - 1}&q=${encodeURIComponent(search.q ?? "")}&status=${encodeURIComponent(search.status ?? "")}`}
              >
                Anterior
              </Link>
            )}
            {page * 25 < count && (
              <Link
                className="button outline small"
                href={`?page=${page + 1}&q=${encodeURIComponent(search.q ?? "")}&status=${encodeURIComponent(search.status ?? "")}`}
              >
                Próxima
              </Link>
            )}
          </div>
        </div>
      </section>
      {entity === "stock_lots" && (
        <p className="fine-print">
          * Disponibilidade depende da condição registrada, documentação e
          validade; a transação revalida no servidor.
        </p>
      )}
    </>
  );
}
