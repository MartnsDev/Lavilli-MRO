"use client";
import { useEffect, useState } from "react";
import { OperationForm } from "./operation-form";
export function KitActions({ kitId }: { kitId: string }) {
  const [tools, setTools] = useState<
      { id: string; name: string; code: string }[]
    >([]),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/kits/" + kitId)
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw Error(b.error);
        setTools(b.data);
      })
      .catch((e) => setError(e.message));
  }, [kitId]);
  const fields = tools.map((t) => ({
    key: t.id,
    label: t.code + " · " + t.name,
    type: "boolean",
    required: false,
  }));
  return (
    <div className="card">
      <h2>Conferência do kit</h2>
      <p className="fine-print">
        Marque somente os itens efetivamente encontrados. A saída exige todos;
        faltantes no retorno geram ocorrência.
      </p>
      {error && <p role="alert">{error}</p>}
      {tools.length > 0 ? (
        <div className="record-actions">
          <OperationForm
            title="Retirar kit"
            fields={[
              ...fields,
              {
                key: "destination",
                label: "Destino / finalidade",
                type: "text",
                required: true,
              },
              {
                key: "aircraft_id",
                label: "Aeronave (se aplicável)",
                type: "ref:aircraft",
                required: false,
              },
            ]}
            command={{ action: "kit_checkout", data: { kit_id: kitId } }}
            buildData={(values) => ({
              checked_tool_ids: tools
                .filter((t) => values[t.id])
                .map((t) => t.id),
              destination: values.destination,
              aircraft_id: values.aircraft_id,
            })}
          />
          <OperationForm
            title="Devolver kit"
            variant="outline"
            fields={[
              ...fields,
              {
                key: "location_id",
                label: "Local de guarda",
                type: "ref:locations",
                required: true,
              },
            ]}
            command={{ action: "kit_return", data: { kit_id: kitId } }}
            buildData={(values) => ({
              checked_tool_ids: tools
                .filter((t) => values[t.id])
                .map((t) => t.id),
              location_id: values.location_id,
            })}
          />
        </div>
      ) : (
        <p>
          Associe ferramentas em Itens dos kits antes de movimentar este kit.
        </p>
      )}
    </div>
  );
}
