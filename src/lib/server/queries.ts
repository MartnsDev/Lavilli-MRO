import "server-only";
import { session } from "./auth";
import { db } from "./db";
import { resources } from "@/lib/domain/resources";
export type Row = Record<string, unknown> & { id: string; version?: number };
export async function list(
  entity: string,
  {
    page = 1,
    q = "",
    status = "",
  }: { page?: number; q?: string; status?: string } = {},
) {
  await session();
  page = Number.isFinite(page)
    ? Math.max(1, Math.min(10000, Math.floor(page)))
    : 1;
  q = typeof q === "string" ? q.slice(0, 100) : "";
  status = typeof status === "string" ? status.slice(0, 40) : "";
  const meta = resources[entity];
  if (!meta) throw new Error("NOT_FOUND");
  let query = db()
    .from(entity)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * 25, page * 25 - 1);
  if (!["audit_events", "mechanics"].includes(entity))
    query = query.is("archived_at", null);
  const search = meta.fields
    .filter((f) => ["text", "email"].includes(f.type))
    .map((f) => f.key);
  const clean = q.replace(/[^\p{L}\p{N} _./-]/gu, "").slice(0, 100);
  if (clean && search.length)
    query = query.or(search.map((k) => `${k}.ilike.%${clean}%`).join(","));
  if (
    status &&
    [
      "maintenance_tasks",
      "work_orders",
      "tools",
      "alerts",
      "external_shipments",
      "stock_reservations",
      "physical_counts",
      "tool_discrepancies",
      "email_deliveries",
    ].includes(entity)
  )
    query = query.eq("status", status);
  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Row[], count: count ?? 0 };
}
export async function get(entity: string, id: string) {
  await session();
  if (!resources[entity]) throw new Error("NOT_FOUND");
  const { data, error } = await db()
    .from(entity)
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error("NOT_FOUND");
  return data as Row;
}
export async function options(entity: string) {
  await session();
  if (entity !== "mechanics" && !resources[entity])
    throw new Error("NOT_FOUND");
  let query = db()
    .from(entity)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (entity === "mechanics") query = query.eq("active", true);
  else if (entity !== "audit_events") query = query.is("archived_at", null);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: String(r.id),
    label: String(
      r.name ?? r.registration ?? r.code ?? r.serial_number ?? r.number ?? r.id,
    ),
  }));
}

export async function referenceLabels(
  rows: Row[],
  fields: { key: string; type: string }[],
) {
  await session();
  const labels: Record<string, Record<string, string>> = {};
  await Promise.all(
    fields
      .filter((f) => f.type.startsWith("ref:"))
      .map(async (f) => {
        const target = f.type.slice(4);
        if (!resources[target]) return;
        const ids = [
          ...new Set(
            rows
              .map((r) => r[f.key])
              .filter((v): v is string => typeof v === "string"),
          ),
        ];
        if (!ids.length) return;
        const { data, error } = await db()
          .from(target)
          .select("*")
          .in("id", ids);
        if (error) throw error;
        labels[f.key] = Object.fromEntries(
          (data ?? []).map((r) => [
            r.id,
            String(
              r.name ??
                r.registration ??
                r.code ??
                r.serial_number ??
                r.number ??
                r.id,
            ),
          ]),
        );
      }),
  );
  return labels;
}
