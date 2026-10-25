"use client";
import { OperationForm } from "./operation-form";
import { resources, type Field } from "@/lib/domain/resources";
import type { Row } from "@/lib/server/queries";
const f = (
  key: string,
  label: string,
  type: string,
  required = true,
): Field => ({ key, label, type, required });
export function RecordActions({ entity, row }: { entity: string; row: Row }) {
  const base = { id: row.id, version: row.version };
  return (
    <div className="record-actions">
      {[
        "mechanics",
        "locations",
        "organizations",
        "part_catalog",
        "tools",
        "tool_kits",
        "maintenance_tasks",
        "work_orders",
        "documents",
        "notification_rules",
        "notification_recipients",
        "app_settings",
        "tool_discrepancies",
      ].includes(entity) && (
        <OperationForm
          title="Editar cadastro"
          variant="outline"
          fields={resources[entity].fields}
          initial={row}
          command={{ action: "update", entity, ...base }}
        />
      )}
      {entity === "aircraft" && (
        <OperationForm
          title="Alterar matrícula"
          variant="outline"
          fields={[f("registration", "Nova matrícula", "text")]}
          command={{ action: "aircraft_registration", data: base }}
        />
      )}
      {entity === "part_instances" && (
        <OperationForm
          title="Vincular documento à peça"
          description="Escolha o documento desta unidade. O vínculo usa a ficha e mantém o número de série."
          variant="outline"
          fields={[f("document_id", "Documento", "ref:documents")]}
          command={{
            action: "create",
            entity: "document_links",
            data: { entity: "part_instances", entity_id: row.id },
          }}
        />
      )}
      {entity === "stock_lots" && (
        <>
          <OperationForm
            title="Movimentar estoque"
            fields={[
              f(
                "kind",
                "Operação",
                "select:receive,reserve,release,consume_reserved,consume,discard,transfer",
              ),
              f("quantity", "Quantidade", "number"),
              f(
                "task_id",
                "Tarefa (se aplicável)",
                "ref:maintenance_tasks",
                false,
              ),
              f(
                "work_order_id",
                "Ordem de serviço (se aplicável)",
                "ref:work_orders",
                false,
              ),
              f(
                "aircraft_id",
                "Aeronave (se aplicável)",
                "ref:aircraft",
                false,
              ),
              f(
                "destination_id",
                "Destino (para transferência)",
                "ref:locations",
                false,
              ),
              f(
                "reservation_id",
                "Reserva (para liberar ou consumir)",
                "ref:stock_reservations",
                false,
              ),
            ]}
            command={{ action: "stock", data: { lot_id: row.id } }}
          />
          <OperationForm
            title="Conferir condição / documentação"
            variant="outline"
            fields={[
              f(
                "condition",
                "Condição registrada",
                "select:pending,serviceable,unserviceable,quarantine,scrap",
              ),
              f("documentation", "Documentação", "select:pending,complete"),
            ]}
            command={{
              action: "stock",
              data: { lot_id: row.id, kind: "verify", quantity: 1 },
            }}
          />
        </>
      )}
      {entity === "part_instances" && (
        <>
          <OperationForm
            title="Movimentar peça"
            fields={[
              f("kind", "Operação", "select:transfer,install,remove,unknown"),
              f("location_id", "Local de destino", "ref:locations", false),
              f("aircraft_id", "Aeronave (instalação)", "ref:aircraft", false),
              f("position", "Posição (instalação)", "text", false),
            ]}
            command={{
              action: "part_move",
              data: { part_id: row.id, version: row.version },
            }}
          />
          <OperationForm
            title="Registrar condição"
            variant="outline"
            fields={[
              f(
                "condition",
                "Condição registrada",
                "select:pending,serviceable,unserviceable,quarantine,scrap",
              ),
              f("documentation", "Documentação", "select:pending,complete"),
            ]}
            command={{
              action: "part_verify",
              data: { part_id: row.id, version: row.version },
            }}
          />
        </>
      )}
      {entity === "tools" && (
        <>
          {row.status === "in_use" ? (
            <OperationForm
              title="Devolver ferramenta"
              fields={[
                f("location_id", "Local de guarda", "ref:locations"),
                f(
                  "condition",
                  "Estado na devolução",
                  "select:available,damaged,quarantine,missing",
                ),
              ]}
              command={{ action: "tool_return", data: { tool_id: row.id } }}
            />
          ) : row.status === "available" ? (
            <OperationForm
              title="Retirar ferramenta"
              fields={[
                f("destination", "Destino / finalidade", "text"),
                f(
                  "aircraft_id",
                  "Aeronave (se aplicável)",
                  "ref:aircraft",
                  false,
                ),
                f("task_id", "Tarefa", "ref:maintenance_tasks", false),
                f(
                  "work_order_id",
                  "Ordem de serviço",
                  "ref:work_orders",
                  false,
                ),
                f("due_at", "Retorno previsto", "datetime-local", false),
              ]}
              command={{ action: "tool_checkout", data: { tool_id: row.id } }}
            />
          ) : null}
          <OperationForm
            title="Registrar condição"
            variant="outline"
            fields={[
              f(
                "status",
                "Estado informado",
                "select:available,damaged,maintenance,quarantine,missing,retired,calibration",
              ),
            ]}
            command={{ action: "tool_condition", data: { tool_id: row.id } }}
          />
          <OperationForm
            title="Registrar calibração"
            variant="outline"
            fields={[
              f("performed_at", "Data da calibração", "date"),
              f("due_at", "Próximo vencimento", "date"),
              f("result", "Resultado informado", "select:accepted,rejected"),
              f("certificate_reference", "Referência do certificado", "text"),
            ]}
            command={{ action: "calibration", data: { tool_id: row.id } }}
          />
        </>
      )}
      {["maintenance_tasks", "work_orders"].includes(entity) && (
        <OperationForm
          title="Alterar andamento"
          fields={[
            f(
              "status",
              "Novo estado",
              "select:open,in_progress,waiting_part,waiting_tool,waiting_document,waiting_inspection,paused,administratively_complete,cancelled",
            ),
          ]}
          command={{ action: "task_status", entity, data: base }}
        />
      )}
      {entity === "physical_counts" && (
        <>
          <OperationForm
            title="Registrar contagem"
            fields={[
              f("lot_id", "Lote contado", "ref:stock_lots"),
              f("counted", "Quantidade encontrada", "number"),
            ]}
            command={{ action: "inventory_count", data: { count_id: row.id } }}
          />
          <OperationForm
            title="Encerrar inventário"
            variant="outline"
            command={{ action: "inventory_close", data: { id: row.id } }}
          />
        </>
      )}
      {entity === "physical_count_items" && !row.reconciled && (
        <OperationForm
          title="Conciliar divergência"
          command={{ action: "inventory_reconcile", data: { id: row.id } }}
        />
      )}
      {entity === "external_shipments" && (
        <>
          {row.status === "preparing" ? (
            <>
              <OperationForm
                title="Adicionar material"
                fields={[
                  f(
                    "lot_id",
                    "Lote (ou selecione peça)",
                    "ref:stock_lots",
                    false,
                  ),
                  f(
                    "part_instance_id",
                    "Peça serializada (ou selecione lote)",
                    "ref:part_instances",
                    false,
                  ),
                  f("quantity", "Quantidade", "number"),
                ]}
                command={{
                  action: "shipment_add",
                  data: { shipment_id: row.id },
                }}
              />
              <OperationForm
                title="Registrar despacho"
                variant="outline"
                command={{
                  action: "shipment_dispatch",
                  data: { shipment_id: row.id },
                }}
              />
            </>
          ) : (
            <OperationForm
              title="Atualizar acompanhamento"
              fields={[
                f(
                  "status",
                  "Estado",
                  "select:in_transit,received_by_third_party,waiting_service,returning,pending_verification,administratively_closed",
                ),
              ]}
              command={{
                action: "shipment_status",
                data: { shipment_id: row.id },
              }}
            />
          )}
        </>
      )}
      {entity === "external_shipment_items" && (
        <OperationForm
          title="Receber retorno parcial"
          fields={[
            f("quantity", "Quantidade recebida", "number"),
            f("location_id", "Local de recebimento", "ref:locations"),
          ]}
          command={{ action: "shipment_return", data: { item_id: row.id } }}
        />
      )}
      {entity === "alerts" && (
        <OperationForm
          title="Atualizar alerta"
          fields={[f("status", "Tratamento", "select:acknowledged,resolved")]}
          command={{ action: "alert_status", data: { id: row.id } }}
        />
      )}
      {[
        "organizations",
        "part_catalog",
        "locations",
        "notification_recipients",
        "notification_rules",
        "app_settings",
      ].includes(entity) && (
        <OperationForm
          title="Arquivar cadastro"
          variant="destructive"
          description="O cadastro será arquivado; o histórico será preservado."
          command={{ action: "archive", entity, ...base }}
        />
      )}
    </div>
  );
}
