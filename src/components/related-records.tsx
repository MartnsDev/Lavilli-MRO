import Link from "next/link";
import { session } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { resources, label } from "@/lib/domain/resources";
import { dateBR } from "@/lib/utils";
const relations: Record<string, [string, string][]> = {
  aircraft: [
    ["maintenance_tasks", "aircraft_id"],
    ["work_orders", "aircraft_id"],
    ["part_instances", "aircraft_id"],
    ["tool_checkouts", "aircraft_id"],
    ["stock_movements", "aircraft_id"],
  ],
  maintenance_tasks: [
    ["tool_checkouts", "task_id"],
    ["stock_movements", "task_id"],
  ],
  work_orders: [
    ["maintenance_tasks", "work_order_id"],
    ["tool_checkouts", "work_order_id"],
    ["stock_movements", "work_order_id"],
  ],
  tools: [
    ["tool_checkouts", "tool_id"],
    ["tool_calibrations", "tool_id"],
    ["tool_discrepancies", "tool_id"],
  ],
  stock_lots: [
    ["stock_movements", "lot_id"],
    ["stock_reservations", "lot_id"],
  ],
  external_shipments: [
    ["external_shipment_items", "shipment_id"],
    ["external_tracking_events", "shipment_id"],
  ],
  physical_counts: [["physical_count_items", "count_id"]],
  import_jobs: [["import_job_rows", "job_id"]],
};
export async function RelatedRecords({
  entity,
  id,
}: {
  entity: string;
  id: string;
}) {
  await session();
  const groups = await Promise.all(
    (relations[entity] ?? []).map(async ([target, key]) => {
      const { data, error, count } = await db()
        .from(target)
        .select("*", { count: "exact" })
        .eq(key, id)
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return { target, rows: data ?? [], count: count ?? 0 };
    }),
  );
  const { data: links, error } = await db()
    .from("document_links")
    .select("id,document_id,documents(name)")
    .eq("entity", entity)
    .eq("entity_id", id)
    .is("archived_at", null)
    .limit(100);
  if (error) throw error;
  return (
    <>
      {groups.map((g) => (
        <section className="card" key={g.target}>
          <h2>
            {resources[g.target]?.title ?? g.target} · {g.count}
          </h2>
          {g.rows.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Registro</th>
                    <th>Situação / operação</th>
                    <th>Quantidade</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link
                          className="record-link"
                          href={`/records/${g.target}/${r.id}`}
                        >
                          {String(
                            r.name ??
                              r.reason ??
                              r.code ??
                              r.row_number ??
                              r.id,
                          )}
                        </Link>
                      </td>
                      <td>{label(r.status ?? r.kind ?? r.return_condition)}</td>
                      <td>{String(r.quantity ?? r.counted ?? "—")}</td>
                      <td>{dateBR(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="fine-print">Nenhum registro relacionado.</p>
          )}
          {g.count > 25 && (
            <p className="fine-print">
              Exibindo os 25 mais recentes. Consulte o relatório para o
              histórico completo.
            </p>
          )}
        </section>
      ))}
      {links?.length ? (
        <section className="card">
          <h2>Documentos vinculados</h2>
          <ul>
            {links.map((l) => (
              <li key={l.id}>
                <Link
                  className="record-link"
                  href={"/records/documents/" + l.document_id}
                >
                  {(l.documents as unknown as { name: string } | null)?.name ??
                    l.document_id}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
