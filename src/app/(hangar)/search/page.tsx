import Link from "next/link";
import { list } from "@/lib/server/queries";
import { resources } from "@/lib/domain/resources";
export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "",
    page = typeof params.page === "string" ? params.page : "1";
  const term = q.trim().slice(0, 100),
    p = Math.max(1, Math.min(1000, Number(page) || 1));
  const entities = [
    "part_catalog",
    "part_instances",
    "stock_lots",
    "tools",
    "aircraft",
    "work_orders",
    "maintenance_tasks",
    "organizations",
    "locations",
  ];
  const groups =
    term.length >= 2
      ? await Promise.all(
          entities.map(async (entity) => ({
            entity,
            ...(await list(entity, { q: term, page: p })),
          })),
        )
      : [];
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">PESQUISA AUTENTICADA</span>
        <h1>Busca global</h1>
        <p>
          Resultados agrupados por tipo. Até 25 registros por grupo e página.
        </p>
      </div>
      <form className="card search-form">
        <label>
          Nome, P/N, S/N, matrícula, lote, código ou fornecedor
          <input
            name="q"
            required
            minLength={2}
            maxLength={100}
            defaultValue={q}
          />
        </label>
        <button className="button primary">Pesquisar</button>
      </form>
      {groups.map((g) => (
        <section className="card" key={g.entity}>
          <h2>
            {resources[g.entity].title}{" "}
            <span className="muted">({g.count})</span>
          </h2>
          {g.rows.length ? (
            <ul className="search-results">
              {g.rows.map((r) => (
                <li key={r.id}>
                  <Link href={`/records/${g.entity}/${r.id}`}>
                    {String(
                      r.name ??
                        r.registration ??
                        r.code ??
                        r.serial_number ??
                        r.id,
                    )}
                  </Link>
                  <small>
                    {String(r.part_number ?? r.serial_number ?? r.number ?? "")}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nenhum resultado neste grupo.</p>
          )}
        </section>
      ))}
      {term.length >= 2 && (
        <div className="pagination">
          {p > 1 && (
            <Link
              className="button outline"
              href={`?q=${encodeURIComponent(term)}&page=${p - 1}`}
            >
              Anterior
            </Link>
          )}
          <span>Página {p}</span>
          {groups.some((g) => g.count > p * 25) && (
            <Link
              className="button outline"
              href={`?q=${encodeURIComponent(term)}&page=${p + 1}`}
            >
              Próxima
            </Link>
          )}
        </div>
      )}
    </>
  );
}
