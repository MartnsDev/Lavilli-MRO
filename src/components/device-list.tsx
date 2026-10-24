"use client";
import { OperationForm } from "./operation-form";
export function DeviceList({
  rows,
}: {
  rows: {
    id: string;
    label: string;
    revoked_at: string | null;
    expires_at: string;
  }[];
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Dispositivo</th>
            <th>Validade</th>
            <th>Situação</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.label}</td>
              <td>
                {new Date(r.expires_at).toLocaleDateString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })}
              </td>
              <td>{r.revoked_at ? "Revogado" : "Autorizado"}</td>
              <td>
                {!r.revoked_at && (
                  <OperationForm
                    title="Revogar dispositivo"
                    variant="destructive"
                    command={{ action: "revoke_device", data: { id: r.id } }}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
