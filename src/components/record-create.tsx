"use client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Field } from "@/lib/domain/resources";
import { OperationForm } from "./operation-form";
export function RecordCreate({
  entity,
  title,
  fields,
  initial,
  serialNumber = "",
  partNumber = "",
}: {
  entity: string;
  title: string;
  fields: Field[];
  initial: Record<string, unknown>;
  serialNumber?: string;
  partNumber?: string;
}) {
  const router = useRouter();
  const continueToUnit = entity === "part_catalog" && Boolean(serialNumber);
  return (
    <OperationForm
      title={"Cadastrar · " + title}
      fields={fields}
      initial={initial}
      command={{ action: "create", entity }}
      refreshOnSuccess={!continueToUnit}
      onSuccess={(saved) => {
        if (!continueToUnit) return;
        const id =
          saved && typeof saved === "object" && "id" in saved
            ? saved.id
            : undefined;
        if (typeof id === "string" && /^[a-f0-9-]{36}$/i.test(id))
          router.push(
            "/records/part_instances?" +
              new URLSearchParams({
                catalog_id: id,
                serial_number: serialNumber,
                part_number: partNumber,
              }),
          );
        else router.refresh();
      }}
    >
      <Plus size={18} /> Novo cadastro
    </OperationForm>
  );
}
