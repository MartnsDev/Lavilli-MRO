import { z } from "zod";
export type Field = {
  key: string;
  label: string;
  type: string;
  required: boolean;
};
export type Resource = {
  title: string;
  description: string;
  fields: Field[];
  columns?: Field[];
};
export const resources: Record<string, Resource> = {
  locations: {
    title: "Localizações",
    description: "Mapeie hangar, armários, prateleiras e gavetas.",
    fields: [
      {
        key: "name",
        label: "Nome",
        type: "text",
        required: true,
      },
      {
        key: "code",
        label: "Código",
        type: "text",
        required: true,
      },
      {
        key: "parent_id",
        label: "Local superior",
        type: "ref:locations",
        required: false,
      },
      {
        key: "kind",
        label: "Tipo",
        type: "select:hangar,workshop,bay,cabinet,shelf,drawer,box,receiving,quarantine,external,other",
        required: true,
      },
      {
        key: "active",
        label: "Ativo",
        type: "boolean",
        required: true,
      },
    ],
  },
  organizations: {
    title: "Empresas e proprietários",
    description: "Fornecedores, terceiros e proprietários de materiais.",
    fields: [
      {
        key: "name",
        label: "Nome",
        type: "text",
        required: true,
      },
      {
        key: "kind",
        label: "Tipo",
        type: "select:supplier,owner,third_party",
        required: true,
      },
      {
        key: "email",
        label: "E-mail",
        type: "email",
        required: false,
      },
      {
        key: "phone",
        label: "Telefone",
        type: "text",
        required: false,
      },
    ],
  },
  aircraft: {
    title: "Aeronaves",
    description: "Fichas de acompanhamento operacional das aeronaves.",
    fields: [
      {
        key: "registration",
        label: "Matrícula",
        type: "text",
        required: true,
      },
      {
        key: "manufacturer",
        label: "Fabricante",
        type: "text",
        required: false,
      },
      {
        key: "model",
        label: "Modelo",
        type: "text",
        required: false,
      },
      {
        key: "serial_number",
        label: "Número de série",
        type: "text",
        required: false,
      },
      {
        key: "location_id",
        label: "Localização",
        type: "ref:locations",
        required: false,
      },
      {
        key: "status",
        label: "Cadastro",
        type: "select:active,inactive",
        required: true,
      },
    ],
  },
  part_catalog: {
    title: "Peças e componentes",
    description:
      "Catálogo por Part Number; unidades físicas e lotes têm controle separado.",
    fields: [
      {
        key: "name",
        label: "Descrição",
        type: "text",
        required: true,
      },
      {
        key: "part_number",
        label: "Part Number",
        type: "text",
        required: true,
      },
      {
        key: "manufacturer",
        label: "Fabricante",
        type: "text",
        required: false,
      },
      {
        key: "category",
        label: "Categoria",
        type: "text",
        required: false,
      },
      {
        key: "unit",
        label: "Unidade",
        type: "select:un,kg,g,l,ml,m,cm",
        required: true,
      },
      {
        key: "minimum_stock",
        label: "Estoque mínimo",
        type: "number",
        required: true,
      },
    ],
  },
  part_instances: {
    title: "Peças serializadas",
    description:
      "Localização, condição registrada e documentação de cada unidade.",
    fields: [
      {
        key: "catalog_id",
        label: "Item do catálogo",
        type: "ref:part_catalog",
        required: true,
      },
      {
        key: "serial_number",
        label: "Serial Number",
        type: "text",
        required: true,
      },
      {
        key: "owner_id",
        label: "Proprietário",
        type: "ref:organizations",
        required: false,
      },
      {
        key: "location_id",
        label: "Localização",
        type: "ref:locations",
        required: true,
      },
      {
        key: "condition",
        label: "Condição registrada",
        type: "select:pending,serviceable,unserviceable,quarantine,scrap",
        required: true,
      },
      {
        key: "documentation",
        label: "Documentação",
        type: "select:pending,complete",
        required: true,
      },
    ],
  },
  stock_lots: {
    title: "Estoque e lotes",
    description:
      "Recebimentos e saídas preservam o histórico e o saldo físico.",
    fields: [
      {
        key: "catalog_id",
        label: "Item do catálogo",
        type: "ref:part_catalog",
        required: true,
      },
      {
        key: "code",
        label: "Lote",
        type: "text",
        required: true,
      },
      {
        key: "location_id",
        label: "Localização",
        type: "ref:locations",
        required: true,
      },
      {
        key: "owner_id",
        label: "Proprietário",
        type: "ref:organizations",
        required: false,
      },
      {
        key: "supplier_id",
        label: "Fornecedor",
        type: "ref:organizations",
        required: false,
      },
      {
        key: "expires_at",
        label: "Validade",
        type: "date",
        required: false,
      },
      {
        key: "condition",
        label: "Condição registrada",
        type: "select:pending,serviceable,unserviceable,quarantine,scrap",
        required: true,
      },
      {
        key: "documentation",
        label: "Documentação",
        type: "select:pending,complete",
        required: true,
      },
    ],
  },
  physical_counts: {
    title: "Inventários",
    description:
      "Abra uma sessão e registre contagens para reconciliar divergências.",
    fields: [
      {
        key: "name",
        label: "Nome",
        type: "text",
        required: true,
      },
      {
        key: "location_id",
        label: "Localização",
        type: "ref:locations",
        required: true,
      },
    ],
  },
  stock_reservations: {
    title: "Reservas",
    description: "Reserva reduz o disponível sem alterar a quantidade física.",
    fields: [],
  },
  stock_movements: {
    title: "Movimentações de estoque",
    description: "Entradas, consumo, transferências e correções justificadas.",
    fields: [],
  },
  physical_count_items: {
    title: "Contagens físicas",
    description: "Contagens e ajustes conciliados, com histórico preservado.",
    fields: [],
  },
  tools: {
    title: "Ferramentas",
    description:
      "Patrimônio, guarda, retiradas e calibração em uma única ficha.",
    fields: [
      {
        key: "name",
        label: "Nome",
        type: "text",
        required: true,
      },
      {
        key: "code",
        label: "Código patrimonial",
        type: "text",
        required: true,
      },
      {
        key: "brand",
        label: "Marca",
        type: "text",
        required: false,
      },
      {
        key: "model",
        label: "Modelo",
        type: "text",
        required: false,
      },
      {
        key: "serial_number",
        label: "Número de série",
        type: "text",
        required: false,
      },
      {
        key: "owner_id",
        label: "Proprietário",
        type: "ref:organizations",
        required: false,
      },
      {
        key: "location_id",
        label: "Local de guarda",
        type: "ref:locations",
        required: true,
      },
      {
        key: "calibration_required",
        label: "Exige calibração",
        type: "boolean",
        required: true,
      },
    ],
  },
  tool_kits: {
    title: "Kits de ferramentas",
    description: "Composição explícita de caixas e kits.",
    fields: [
      {
        key: "name",
        label: "Nome",
        type: "text",
        required: true,
      },
      {
        key: "code",
        label: "Código",
        type: "text",
        required: true,
      },
      {
        key: "require_check",
        label: "Conferência obrigatória",
        type: "boolean",
        required: true,
      },
    ],
  },
  tool_kit_items: {
    title: "Itens dos kits",
    description: "Associe ferramentas individuais aos kits.",
    fields: [
      {
        key: "kit_id",
        label: "Kit",
        type: "ref:tool_kits",
        required: true,
      },
      {
        key: "tool_id",
        label: "Ferramenta",
        type: "ref:tools",
        required: true,
      },
    ],
  },
  tool_checkouts: {
    title: "Retiradas e devoluções",
    description: "Acompanhe ferramentas em uso e confirme o retorno à guarda.",
    fields: [],
  },
  tool_inspections: {
    title: "Conferências",
    description: "Registre conferências com resultado e observações.",
    fields: [
      {
        key: "tool_id",
        label: "Ferramenta",
        type: "ref:tools",
        required: false,
      },
      {
        key: "kit_id",
        label: "Kit",
        type: "ref:tool_kits",
        required: false,
      },
      {
        key: "name",
        label: "Conferência",
        type: "text",
        required: true,
      },
      {
        key: "notes",
        label: "Observações",
        type: "textarea",
        required: false,
      },
      {
        key: "status",
        label: "Resultado",
        type: "select:complete,discrepancy",
        required: true,
      },
      {
        key: "aircraft_id",
        label: "Aeronave",
        type: "ref:aircraft",
        required: false,
      },
    ],
  },
  tool_discrepancies: {
    title: "Ocorrências",
    description:
      "Ocorrências de ferramentas preservadas até resolução explícita.",
    fields: [
      {
        key: "tool_id",
        label: "Ferramenta",
        type: "ref:tools",
        required: true,
      },
      {
        key: "name",
        label: "Ocorrência",
        type: "text",
        required: true,
      },
      {
        key: "aircraft_id",
        label: "Aeronave",
        type: "ref:aircraft",
        required: false,
      },
      {
        key: "task_id",
        label: "Tarefa",
        type: "ref:maintenance_tasks",
        required: false,
      },
      {
        key: "status",
        label: "Situação",
        type: "select:open,investigating,resolved",
        required: true,
      },
      {
        key: "notes",
        label: "Investigação",
        type: "textarea",
        required: false,
      },
    ],
  },
  tool_calibrations: {
    title: "Calibrações",
    description: "Registros de calibração e referências dos certificados.",
    fields: [],
  },
  maintenance_tasks: {
    title: "Tarefas",
    description: "Tarefas rápidas, com ou sem aeronave ou ordem de serviço.",
    fields: [
      {
        key: "name",
        label: "Título",
        type: "text",
        required: true,
      },
      {
        key: "description",
        label: "Descrição",
        type: "textarea",
        required: false,
      },
      {
        key: "aircraft_id",
        label: "Aeronave",
        type: "ref:aircraft",
        required: false,
      },
      {
        key: "work_order_id",
        label: "Ordem de serviço",
        type: "ref:work_orders",
        required: false,
      },
      {
        key: "mechanic_id",
        label: "Responsável informado",
        type: "ref:mechanics",
        required: false,
      },
      {
        key: "priority",
        label: "Prioridade",
        type: "select:normal,low,high,critical",
        required: true,
      },
      {
        key: "due_at",
        label: "Prazo",
        type: "datetime-local",
        required: false,
      },
    ],
  },
  work_orders: {
    title: "Ordens de serviço",
    description:
      "Encerramento administrativo para controle operacional interno.",
    fields: [
      {
        key: "name",
        label: "Título",
        type: "text",
        required: true,
      },
      {
        key: "description",
        label: "Descrição",
        type: "textarea",
        required: false,
      },
      {
        key: "aircraft_id",
        label: "Aeronave",
        type: "ref:aircraft",
        required: false,
      },
      {
        key: "mechanic_id",
        label: "Responsável informado",
        type: "ref:mechanics",
        required: false,
      },
      {
        key: "priority",
        label: "Prioridade",
        type: "select:normal,low,high,critical",
        required: true,
      },
      {
        key: "due_at",
        label: "Prazo",
        type: "datetime-local",
        required: false,
      },
    ],
  },
  external_shipments: {
    title: "Materiais externos",
    description:
      "Custódia de materiais enviados a terceiros e retornos parciais.",
    fields: [
      {
        key: "name",
        label: "Remessa",
        type: "text",
        required: true,
      },
      {
        key: "recipient_id",
        label: "Destinatário",
        type: "ref:organizations",
        required: true,
      },
      {
        key: "purpose",
        label: "Finalidade",
        type: "text",
        required: true,
      },
      {
        key: "tracking_code",
        label: "Código de rastreio",
        type: "text",
        required: false,
      },
      {
        key: "carrier",
        label: "Transportadora",
        type: "text",
        required: false,
      },
      {
        key: "expected_return",
        label: "Retorno previsto",
        type: "datetime-local",
        required: false,
      },
    ],
  },
  external_shipment_items: {
    title: "Itens de remessas",
    description: "Itens físicos vinculados a remessas externas.",
    fields: [],
  },
  external_tracking_events: {
    title: "Rastreamento",
    description: "Eventos informados sobre remessas externas.",
    fields: [
      {
        key: "shipment_id",
        label: "Remessa",
        type: "ref:external_shipments",
        required: true,
      },
      {
        key: "name",
        label: "Evento",
        type: "text",
        required: true,
      },
      {
        key: "notes",
        label: "Observações",
        type: "textarea",
        required: false,
      },
    ],
  },
  documents: {
    title: "Documentos",
    description: "Biblioteca privada, referências e versões preservadas.",
    fields: [
      {
        key: "name",
        label: "Nome",
        type: "text",
        required: true,
      },
      {
        key: "category",
        label: "Categoria",
        type: "select:photo,reference,calibration,origin,repair,receipt,internal",
        required: true,
      },
      {
        key: "reference_url",
        label: "Referência autorizada (HTTPS)",
        type: "url",
        required: false,
      },
      {
        key: "notes",
        label: "Observações",
        type: "textarea",
        required: false,
      },
      {
        key: "expires_at",
        label: "Validade",
        type: "date",
        required: false,
      },
    ],
  },
  alerts: {
    title: "Central de alertas",
    description: "Reconhecer um alerta não resolve uma ocorrência.",
    fields: [],
  },
  audit_events: {
    title: "Histórico e auditoria",
    description:
      "Responsável informado, horário do servidor e diferenças de cada alteração.",
    fields: [],
  },
  mechanics: {
    title: "Responsáveis",
    description:
      "Identificação autodeclarada; não representa assinatura técnica autenticada.",
    fields: [
      {
        key: "name",
        label: "Nome",
        type: "text",
        required: true,
      },
      {
        key: "active",
        label: "Ativo",
        type: "boolean",
        required: true,
      },
    ],
  },
  notification_rules: {
    title: "Regras de alertas",
    description: "Antecedência configurável para alertas de vencimento.",
    fields: [
      {
        key: "name",
        label: "Nome",
        type: "text",
        required: true,
      },
      {
        key: "enabled",
        label: "Ativa",
        type: "boolean",
        required: true,
      },
      {
        key: "days_before",
        label: "Antecedência em dias",
        type: "number",
        required: true,
      },
      {
        key: "email_enabled",
        label: "Enviar e-mails",
        type: "boolean",
        required: true,
      },
    ],
  },
  notification_recipients: {
    title: "Destinatários",
    description: "Destinatários de notificações operacionais por e-mail.",
    fields: [
      {
        key: "name",
        label: "Nome",
        type: "text",
        required: true,
      },
      {
        key: "email",
        label: "E-mail",
        type: "email",
        required: true,
      },
      {
        key: "active",
        label: "Ativo",
        type: "boolean",
        required: true,
      },
    ],
  },
  email_deliveries: {
    title: "Entregas de e-mail",
    description: "Fila transacional, tentativas e falhas de entrega.",
    fields: [],
  },
  app_settings: {
    title: "Configurações",
    description: "Parâmetros compartilhados com histórico de alterações.",
    fields: [
      {
        key: "name",
        label: "Chave",
        type: "select:retention_days,label_width_mm,label_height_mm,company_name",
        required: true,
      },
      {
        key: "value",
        label: "Valor",
        type: "text",
        required: true,
      },
    ],
  },
  import_jobs: {
    title: "Importações realizadas",
    description: "Histórico e contagem das importações confirmadas.",
    fields: [],
  },
  activity_comments: {
    title: "Comentários",
    description: "Registros adicionais com responsável informado.",
    fields: [
      {
        key: "entity",
        label: "Tipo",
        type: "select:maintenance_tasks,work_orders,tools,part_instances,external_shipments",
        required: true,
      },
      {
        key: "entity_id",
        label: "Identificador UUID",
        type: "uuid",
        required: true,
      },
      {
        key: "body",
        label: "Comentário",
        type: "textarea",
        required: true,
      },
    ],
  },
};
resources.document_links = {
  title: "Vínculos de documentos",
  description: "Relacione documentos privados às fichas operacionais.",
  fields: [
    {
      key: "document_id",
      label: "Documento",
      type: "ref:documents",
      required: true,
    },
    {
      key: "entity",
      label: "Tipo de registro",
      type: "select:part_instances,tools,stock_lots,aircraft,maintenance_tasks,work_orders,external_shipments,organizations,tool_calibrations,stock_movements",
      required: true,
    },
    {
      key: "entity_id",
      label: "Identificador da ficha (UUID)",
      type: "uuid",
      required: true,
    },
  ],
};
resources.import_job_rows = {
  title: "Linhas importadas",
  description: "Dados processados e erros preservados por linha.",
  fields: [],
};
const readColumns: Record<string, [string, string, string][]> = {
  stock_movements: [
    ["kind", "Operação", "text"],
    ["lot_id", "Lote", "ref:stock_lots"],
    ["quantity", "Quantidade", "number"],
    ["reason", "Motivo", "text"],
  ],
  stock_reservations: [
    ["purpose", "Finalidade", "text"],
    ["lot_id", "Lote", "ref:stock_lots"],
    ["quantity", "Quantidade", "number"],
    ["status", "Situação", "text"],
  ],
  tool_checkouts: [
    ["tool_id", "Ferramenta", "ref:tools"],
    ["mechanic_id", "Responsável informado", "ref:mechanics"],
    ["destination", "Destino", "text"],
    ["returned_at", "Devolução", "text"],
  ],
  tool_calibrations: [
    ["tool_id", "Ferramenta", "ref:tools"],
    ["performed_at", "Calibrada em", "date"],
    ["due_at", "Vencimento", "date"],
    ["result", "Resultado", "text"],
  ],
  physical_count_items: [
    ["count_id", "Inventário", "ref:physical_counts"],
    ["lot_id", "Lote", "ref:stock_lots"],
    ["expected", "Esperado", "number"],
    ["counted", "Contado", "number"],
    ["reconciled", "Conciliado", "boolean"],
  ],
  external_shipment_items: [
    ["shipment_id", "Remessa", "ref:external_shipments"],
    ["lot_id", "Lote", "ref:stock_lots"],
    ["part_instance_id", "Peça", "ref:part_instances"],
    ["quantity", "Enviado", "number"],
    ["returned_quantity", "Retornado", "number"],
  ],
  email_deliveries: [
    ["alert_id", "Alerta", "ref:alerts"],
    ["recipient_id", "Destinatário", "ref:notification_recipients"],
    ["status", "Situação", "text"],
    ["attempts", "Tentativas", "number"],
  ],
  import_jobs: [
    ["name", "Arquivo", "text"],
    ["category", "Categoria", "text"],
    ["success_rows", "Sucessos", "number"],
    ["error_rows", "Erros", "number"],
    ["status", "Situação", "text"],
  ],
  import_job_rows: [
    ["row_number", "Linha", "number"],
    ["job_id", "Importação", "ref:import_jobs"],
    ["error", "Erro registrado", "text"],
  ],
  audit_events: [
    ["entity", "Entidade", "text"],
    ["action", "Ação", "text"],
    ["mechanic_id", "Responsável informado", "ref:mechanics"],
    ["reason", "Motivo", "text"],
  ],
};
for (const [key, columns] of Object.entries(readColumns))
  resources[key].columns = columns.map(([key, label, type]) => ({
    key,
    label,
    type,
    required: false,
  }));
Object.setPrototypeOf(resources, null);

export function resourceSchema(resource: string) {
  const meta = resources[resource];
  if (!meta || !meta.fields.length) throw new Error("INVALID_OPERATION");
  const shape: Record<string, z.ZodType> = {};
  for (const f of meta.fields) {
    let s: z.ZodType;
    if (f.type.startsWith("ref:") || f.type === "uuid") s = z.uuid();
    else if (f.type.startsWith("select:"))
      s = z.enum(f.type.slice(7).split(",") as [string, ...string[]]);
    else if (f.type === "number") s = z.number().finite().min(0).max(1e12);
    else if (f.type === "boolean") s = z.boolean();
    else if (f.type === "email") s = z.email().max(254);
    else if (f.type === "url")
      s = z.url().refine((v) => v.startsWith("https://"), "Use HTTPS");
    else if (f.type === "date") s = z.iso.date();
    else if (f.type === "datetime-local") s = z.iso.datetime({ offset: true });
    else
      s = z
        .string()
        .trim()
        .min(1)
        .max(f.type === "textarea" ? 5000 : 200);
    shape[f.key] = f.required ? s : s.nullable().optional();
  }
  return z.object(shape).strict();
}
export const statusLabels: Record<string, string> = {
  open: "Aberta",
  in_progress: "Em andamento",
  waiting_part: "Aguardando peça",
  waiting_tool: "Aguardando ferramenta",
  waiting_document: "Aguardando documento",
  waiting_inspection: "Aguardando inspeção",
  paused: "Pausada",
  administratively_complete: "Concluída administrativamente",
  cancelled: "Cancelada",
  pending: "Pendente",
  serviceable: "Utilizável conforme condição registrada",
  unserviceable: "Não utilizável",
  quarantine: "Quarentena",
  scrap: "Baixa",
  complete: "Completa",
  available: "Disponível",
  in_use: "Em uso",
  calibration: "Em calibração",
  damaged: "Danificada",
  maintenance: "Em manutenção",
  missing: "Desaparecida",
  retired: "Retirada de uso",
  stored: "Armazenada",
  installed: "Instalada (registro interno)",
  external: "Externa",
  transit: "Em trânsito",
  unknown: "Localização desconhecida",
  active: "Ativo",
  inactive: "Inativo",
  normal: "Normal",
  low: "Baixa",
  high: "Alta",
  critical: "Crítica",
  supplier: "Fornecedor",
  owner: "Proprietário",
  third_party: "Terceiro",
  preparing: "Preparando",
  dispatched: "Despachado",
  in_transit: "Em trânsito",
  received_by_third_party: "Recebido pelo terceiro",
  waiting_service: "Aguardando serviço",
  returning: "Retornando",
  received_internally: "Recebido internamente",
  pending_verification: "Aguardando conferência",
  administratively_closed: "Encerrada administrativamente",
  acknowledged: "Reconhecido",
  resolved: "Resolvido",
  discrepancy: "Divergência",
  investigating: "Em investigação",
  closed: "Encerrado",
  released: "Liberada",
  consumed: "Consumida",
  sent: "Enviado",
  failed: "Falha",
  sending: "Enviando",
  accepted: "Aceita",
  rejected: "Rejeitada",
  photo: "Fotografia",
  reference: "Referência",
  receive: "Recebimento",
  reserve: "Reserva",
  release: "Liberar reserva",
  consume_reserved: "Consumir reserva",
  consume: "Consumo",
  discard: "Baixa / descarte",
  transfer: "Transferência",
  install: "Instalação registrada",
  remove: "Remoção registrada",
  create: "Somente criar",
  skip_duplicates: "Ignorar duplicados",
  origin: "Origem/rastreabilidade",
  repair: "Reparo",
  receipt: "Recebimento",
  internal: "Interno",
  hangar: "Hangar",
  workshop: "Oficina",
  bay: "Baia",
  cabinet: "Armário",
  shelf: "Prateleira",
  drawer: "Gaveta",
  box: "Caixa",
  receiving: "Recebimento",
  other: "Outro",
  info: "Informação",
  warning: "Atenção",
};
Object.setPrototypeOf(statusLabels, null);

export function label(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return statusLabels[String(value)] ?? String(value);
}
