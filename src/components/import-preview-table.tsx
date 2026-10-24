"use client";
import { useMemo } from "react";
import { useTable, tableFeatures, type ColumnDef } from "@tanstack/react-table";
const features = tableFeatures({});
type PreviewRow = { row: number; data: Record<string, unknown>; error: string };
export function ImportPreviewTable({ rows }: { rows: PreviewRow[] }) {
  const columns = useMemo<ColumnDef<typeof features, PreviewRow>[]>(
    () => [
      { accessorKey: "row", header: "Linha" },
      {
        accessorKey: "data",
        header: "Dados normalizados",
        cell: ({ row }) => (
          <pre>{JSON.stringify(row.original.data, null, 2)}</pre>
        ),
      },
      {
        accessorKey: "error",
        header: "Validação",
        cell: ({ row }) => row.original.error || "Formato válido",
      },
    ],
    [],
  );
  const table = useTable({ features, data: rows, columns });
  return (
    <div className="table-wrap">
      <table>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id}>
                  <table.FlexRender header={header} />
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getAllCells().map((cell) => (
                <td key={cell.id}>
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
