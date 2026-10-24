"use client";
import { useMemo, useRef, useState } from "react";
import { resources, resourceSchema } from "@/lib/domain/resources";
import { ImportPreviewTable } from "./import-preview-table";
import { OperationForm } from "./operation-form";
import { useHydrated } from "@/lib/use-hydrated";
export function ImportWizard() {
  const ready = useHydrated();
  const input = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("part_catalog"),
    [headers, setHeaders] = useState<string[]>([]),
    [rows, setRows] = useState<string[][]>([]),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [name, setName] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const fields = resources[category].fields;
  const parsed = useMemo(
    () =>
      rows.map((row, i) => {
        const data: Record<string, unknown> = {};
        for (const f of resources[category].fields) {
          const index = Number(mapping[f.key] ?? -1),
            value = row[index]?.trim();
          if (!value) {
            if (f.required)
              data[f.key] =
                f.type === "boolean" ? true : f.type === "number" ? 0 : "";
            else data[f.key] = null;
          } else
            data[f.key] =
              f.type === "number"
                ? Number(value.replace(",", "."))
                : f.type === "boolean"
                  ? ["true", "sim", "1"].includes(value.toLowerCase())
                  : f.type === "datetime-local"
                    ? value
                    : value;
        }
        const result = resourceSchema(category).safeParse(data);
        return {
          row: i + 2,
          data,
          error: result.success
            ? ""
            : result.error.issues
                .map((e) => e.path.join(".") + ": " + e.message)
                .join("; "),
        };
      }),
    [rows, mapping, category],
  );
  return (
    <>
      <section className="card stack">
        <label>
          Categoria
          <select
            value={category}
            disabled={!ready || busy}
            onChange={(e) => {
              setCategory(e.target.value);
              setRows([]);
              setHeaders([]);
              setMapping({});
            }}
          >
            {[
              "part_catalog",
              "tools",
              "stock_lots",
              "aircraft",
              "organizations",
              "locations",
            ].map((k) => (
              <option key={k} value={k}>
                {resources[k].title}
              </option>
            ))}
          </select>
        </label>
        <a
          className="button outline"
          href={"/api/imports/template?category=" + category}
        >
          Baixar modelo vazio CSV
        </a>
        <label>
          Arquivo (.xlsx ou .csv)
          <input
            type="file"
            ref={input}
            accept=".xlsx,.csv"
            disabled={busy || !ready}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              setError("");
              setRows([]);
              try {
                const f = new FormData();
                f.set("file", file);
                const r = await fetch("/api/imports/preview", {
                  method: "POST",
                  body: f,
                });
                const b = await r.json();
                if (!r.ok) throw Error(b.error);
                setHeaders(b.headers);
                setRows(b.rows);
                setName(file.name);
                setMapping(
                  Object.fromEntries(
                    fields.map((f) => [
                      f.key,
                      String(b.headers.indexOf(f.key)),
                    ]),
                  ),
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        {busy && <p role="status">Lendo arquivo…</p>}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
      </section>
      {headers.length > 0 && (
        <section className="card">
          <h2>Mapear colunas</h2>
          <div className="link-grid">
            {fields.map((f) => (
              <label key={f.key}>
                {f.label}
                {f.required ? " *" : ""}
                <select
                  value={mapping[f.key] ?? "-1"}
                  onChange={(e) =>
                    setMapping({ ...mapping, [f.key]: e.target.value })
                  }
                >
                  <option value="-1">Sem coluna</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="fine-print">
            Referências a local, catálogo e proprietário usam UUIDs existentes.
            Fórmulas, macros e vínculos executáveis não são processados.
          </p>
        </section>
      )}
      {rows.length > 0 && (
        <section className="card">
          <h2>Prévia · {rows.length} linhas</h2>
          <ImportPreviewTable rows={parsed} />
          {!parsed.some((r) => r.error) && (
            <OperationForm
              title="Confirmar importação"
              fields={[
                {
                  key: "mode",
                  label: "Duplicidades",
                  type: "select:create,skip_duplicates",
                  required: true,
                },
              ]}
              command={{
                action: "import_rows",
                data: { category, name, rows: parsed.map((r) => r.data) },
              }}
              onSuccess={() => {
                setRows([]);
                if (input.current) input.current.value = "";
              }}
            />
          )}
          <p className="fine-print">
            Referências, constraints e duplicidades são revalidadas na
            transação. Erros de banco são registrados por linha no histórico.
          </p>
        </section>
      )}
    </>
  );
}
