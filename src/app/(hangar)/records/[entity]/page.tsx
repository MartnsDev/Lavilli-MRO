import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, ArrowUpRight, Filter, PackageOpen } from "lucide-react";
import { resources, label } from "@/lib/domain/resources";
import { list, referenceLabels } from "@/lib/server/queries";
import { OperationForm } from "@/components/operation-form";
import { dateBR, dayKeySP } from "@/lib/utils";
export default async function Records({
  params,
  searchParams,
}: {
  params: Promise<{ entity: string }>;
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const { entity } = await params,
    meta = resources[entity];
  if (!meta) notFound();
  const raw = await searchParams;
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
          <OperationForm
            title={"Cadastrar · " + meta.title}
            fields={meta.fields}
            command={{ action: "create", entity }}
          >
            <Plus size={18} /> Novo cadastro
          </OperationForm>
        )}
      </div>

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
