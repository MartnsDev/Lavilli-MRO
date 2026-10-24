import { z } from "zod";
import { resourceSchema, resources } from "./resources";
const id = z.uuid(),
  n = z.number().finite().positive().max(1e12),
  date = z.iso.date(),
  optionalId = id.nullable().optional();
const definitions: Record<string, z.ZodType> = {
  document_version: z
    .object({
      document_id: id,
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
      mime_type: z.enum(["application/pdf", "image/png", "image/jpeg"]),
      size_bytes: z.number().int().positive().max(10485760),
    })
    .strict(),
  stock: z
    .object({
      lot_id: id,
      task_id: optionalId,
      work_order_id: optionalId,
      aircraft_id: optionalId,
      kind: z.enum([
        "receive",
        "reserve",
        "release",
        "consume_reserved",
        "consume",
        "discard",
        "transfer",
        "verify",
      ]),
      quantity: n,
      destination_id: optionalId,
      reservation_id: optionalId,
      condition: z
        .enum([
          "pending",
          "serviceable",
          "unserviceable",
          "quarantine",
          "scrap",
        ])
        .optional(),
      documentation: z.enum(["pending", "complete"]).optional(),
    })
    .strict()
    .superRefine((d, ctx) => {
      if (d.kind === "verify" && (!d.condition || !d.documentation))
        ctx.addIssue({
          code: "custom",
          message: "Informe condição e documentação.",
        });
    }),
  tool_checkout: z
    .object({
      tool_id: id,
      destination: z.string().trim().min(2).max(200),
      aircraft_id: optionalId,
      task_id: optionalId,
      work_order_id: optionalId,
      due_at: z.iso.datetime({ offset: true }).nullable().optional(),
    })
    .strict(),
  tool_return: z
    .object({
      tool_id: id,
      location_id: id,
      condition: z.enum(["available", "damaged", "quarantine", "missing"]),
    })
    .strict(),
  tool_condition: z
    .object({
      tool_id: id,
      status: z.enum([
        "available",
        "damaged",
        "maintenance",
        "quarantine",
        "missing",
        "retired",
        "calibration",
      ]),
    })
    .strict(),
  calibration: z
    .object({
      tool_id: id,
      performed_at: date,
      due_at: date,
      result: z.enum(["accepted", "rejected"]),
      certificate_reference: z.string().trim().min(1).max(200),
    })
    .strict(),
  task_status: z
    .object({
      id,
      version: z.number().int().positive(),
      status: z.enum([
        "open",
        "in_progress",
        "waiting_part",
        "waiting_tool",
        "waiting_document",
        "waiting_inspection",
        "paused",
        "administratively_complete",
        "cancelled",
      ]),
    })
    .strict(),
  part_move: z
    .object({
      part_id: id,
      version: z.number().int().positive(),
      kind: z.enum(["transfer", "install", "remove", "unknown"]),
      location_id: optionalId,
      aircraft_id: optionalId,
      position: z.string().max(200).nullable().optional(),
    })
    .strict(),
  inventory_count: z
    .object({
      count_id: id,
      lot_id: id,
      counted: z.number().finite().min(0).max(1e12),
    })
    .strict(),
  inventory_reconcile: z.object({ id }).strict(),
  alert_status: z
    .object({ id, status: z.enum(["acknowledged", "resolved"]) })
    .strict(),
  revoke_device: z.object({ id }).strict(),
  shipment_add: z
    .object({
      shipment_id: id,
      lot_id: optionalId,
      part_instance_id: optionalId,
      quantity: n,
    })
    .strict()
    .refine((d) => Boolean(d.lot_id) !== Boolean(d.part_instance_id)),
  shipment_dispatch: z.object({ shipment_id: id }).strict(),
  shipment_return: z
    .object({ item_id: id, quantity: n, location_id: id })
    .strict(),
  shipment_status: z
    .object({
      shipment_id: id,
      status: z.enum([
        "in_transit",
        "received_by_third_party",
        "waiting_service",
        "returning",
        "pending_verification",
        "administratively_closed",
      ]),
    })
    .strict(),
  kit_checkout: z
    .object({
      kit_id: id,
      checked_tool_ids: z.array(id).max(200),
      destination: z.string().min(2).max(200),
      aircraft_id: optionalId,
      due_at: z.iso.datetime({ offset: true }).nullable().optional(),
    })
    .strict(),
  kit_return: z
    .object({
      kit_id: id,
      checked_tool_ids: z.array(id).max(200),
      location_id: id,
    })
    .strict(),
  part_verify: z
    .object({
      part_id: id,
      version: z.number().int().positive(),
      condition: z.enum([
        "pending",
        "serviceable",
        "unserviceable",
        "quarantine",
        "scrap",
      ]),
      documentation: z.enum(["pending", "complete"]),
    })
    .strict(),
  aircraft_registration: z
    .object({
      id,
      version: z.number().int().positive(),
      registration: z.string().regex(/^[A-Z0-9]{2,3}-[A-Z0-9]{3,5}$/),
    })
    .strict(),
  inventory_close: z.object({ id }).strict(),
};
definitions.import_rows = z
  .object({
    category: z.enum([
      "locations",
      "organizations",
      "aircraft",
      "part_catalog",
      "tools",
      "stock_lots",
    ]),
    name: z.string().min(1).max(200),
    mode: z.enum(["create", "skip_duplicates"]),
    rows: z.array(z.record(z.string(), z.unknown())).min(1).max(100),
  })
  .strict()
  .transform((v) => ({
    ...v,
    rows: v.rows.map((row) => resourceSchema(v.category).parse(row)),
  }));
const base = z
  .object({
    action: z.string(),
    entity: z.string().optional(),
    id: id.optional(),
    version: z.number().int().positive().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    reason: z.string().trim().min(3).max(2000),
  })
  .strict();
export type Command = z.infer<typeof base>;
export function parseCommand(value: unknown): Command {
  const c = base.parse(value);
  if (["create", "update", "archive"].includes(c.action)) {
    if (!c.entity || !resources[c.entity]) throw new Error("INVALID_OPERATION");
    if (c.action !== "create" && (!c.id || !c.version))
      throw new Error("INVALID_OPERATION");
    if (c.action !== "archive") c.data = resourceSchema(c.entity).parse(c.data);
    if (
      c.entity === "aircraft" &&
      c.action === "create" &&
      !/^[A-Z0-9]{2,3}-[A-Z0-9]{3,5}$/.test(String(c.data?.registration))
    )
      throw new Error("INVALID_OPERATION");
  } else {
    const schema = definitions[c.action];
    if (!schema) throw new Error("INVALID_OPERATION");
    c.data = schema.parse(c.data) as Record<string, unknown>;
    if (
      c.action === "task_status" &&
      !["maintenance_tasks", "work_orders"].includes(c.entity ?? "")
    )
      throw new Error("INVALID_OPERATION");
  }
  return c;
}
