import Link from "next/link";
import { session } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { label } from "@/lib/domain/resources";
type Location = {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
  kind: string;
  active: boolean;
};
export default async function LocationTree() {
  await session();
  const { data, error, count } = await db()
    .from("locations")
    .select("id,name,code,parent_id,kind,active", { count: "exact" })
    .is("archived_at", null)
    .order("name")
    .limit(1000);
  if (error) throw error;
  const rows = (data ?? []) as Location[];
  function tree(
    parent: string | null,
    visited = new Set<string>(),
  ): React.ReactNode {
    return (
      <ul className="location-tree">
        {rows
          .filter(
            (r) =>
              r.parent_id === parent ||
              (parent === null &&
                r.parent_id &&
                !rows.some((p) => p.id === r.parent_id)),
          )
          .map((r) => (
            <li key={r.id}>
              <Link href={"/records/locations/" + r.id}>
                <strong>{r.name}</strong>{" "}
                <span className="muted">
                  {r.code} · {label(r.kind)}
                  {!r.active ? " · Inativo" : ""}
                </span>
              </Link>
              {!visited.has(r.id) && tree(r.id, new Set([...visited, r.id]))}
            </li>
          ))}
      </ul>
    );
  }
  return (
    <>
      <div className="page-heading heading-actions">
        <div>
          <span className="eyebrow">ORGANIZAÇÃO FÍSICA</span>
          <h1>Árvore de localizações</h1>
          <p>Do hangar à gaveta, com endereçamento hierárquico.</p>
        </div>
        <Link className="button outline" href="/records/locations">
          Gerenciar cadastros
        </Link>
      </div>
      <section className="card">
        {rows.length ? (
          tree(null)
        ) : (
          <p>Cadastre o hangar e suas localizações para começar.</p>
        )}
        {(count ?? 0) > 1000 && (
          <p className="notice">
            Exibindo os primeiros 1.000 locais. Consulte a lista paginada para
            os demais.
          </p>
        )}
      </section>
    </>
  );
}
