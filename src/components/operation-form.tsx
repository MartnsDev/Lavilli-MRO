"use client";
import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { label, type Field } from "@/lib/domain/resources";
import type { Command } from "@/lib/domain/commands";
type Option = { id: string; label: string };
function RefSelect({
  field,
  value,
  inputId,
}: {
  field: Field;
  value: unknown;
  inputId?: string;
}) {
  const [options, setOptions] = useState<Option[]>([]),
    [error, setError] = useState(false);
  const [selected, setSelected] = useState(String(value ?? ""));
  useEffect(() => {
    let alive = true;
    fetch("/api/options/" + field.type.slice(4))
      .then(async (r) => {
        if (!r.ok) throw Error();
        const b = await r.json();
        if (alive) setOptions(b.data);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [field.type]);
  return (
    <>
      <select
        id={inputId}
        name={field.key}
        required={field.required}
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
      >
        <option value="">Selecione…</option>
        {selected && !options.some((o) => o.id === selected) ? (
          <option value={selected}>{selected}</option>
        ) : null}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <small role="alert">Não foi possível carregar as opções.</small>
      )}
      <small>Lista com até 200 cadastros recentes.</small>
    </>
  );
}
export function FieldInput({
  field,
  value,
  inputId,
}: {
  field: Field;
  inputId?: string;
  value?: unknown;
}) {
  if (field.type.startsWith("ref:"))
    return <RefSelect field={field} value={value} inputId={inputId} />;
  if (field.type.startsWith("select:"))
    return (
      <select
        id={inputId}
        name={field.key}
        required={field.required}
        defaultValue={String(value ?? field.type.slice(7).split(",")[0])}
      >
        {!field.required && <option value="">Selecione…</option>}
        {field.type
          .slice(7)
          .split(",")
          .map((v) => (
            <option key={v} value={v}>
              {label(v)}
            </option>
          ))}
      </select>
    );
  if (field.type === "boolean")
    return (
      <input
        id={inputId}
        type="checkbox"
        name={field.key}
        defaultChecked={value === undefined ? true : Boolean(value)}
      />
    );
  if (field.type === "textarea")
    return (
      <textarea
        id={inputId}
        name={field.key}
        required={field.required}
        defaultValue={String(value ?? "")}
        rows={3}
        maxLength={5000}
      />
    );
  return (
    <input
      id={inputId}
      name={field.key}
      type={["uuid", "text"].includes(field.type) ? "text" : field.type}
      required={field.required}
      defaultValue={
        field.type === "datetime-local" && value
          ? new Intl.DateTimeFormat("sv-SE", {
              timeZone: "America/Sao_Paulo",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
              .format(new Date(String(value)))
              .replace(" ", "T")
          : String(value ?? (field.type === "number" ? 0 : ""))
      }
      min={field.type === "number" ? 0 : undefined}
      step={field.type === "number" ? "any" : undefined}
      maxLength={field.type === "text" ? 200 : undefined}
    />
  );
}
export function valuesFromForm(fields: Field[], form: FormData) {
  const data: Record<string, unknown> = {};
  for (const f of fields) {
    const value = form.get(f.key);
    if (f.type === "boolean") data[f.key] = form.has(f.key);
    else if (value === null || value === "") {
      if (f.required) data[f.key] = "";
      else data[f.key] = null;
    } else if (f.type === "number") data[f.key] = Number(value);
    else if (f.type === "datetime-local")
      data[f.key] = new Date(String(value) + ":00-03:00").toISOString();
    else data[f.key] = String(value);
  }
  return data;
}
export function OperationForm({
  title,
  description,
  fields = [],
  initial = {},
  command,
  buildData,
  children,
  variant = "default",
  onSuccess,
  refreshOnSuccess = true,
  execute,
}: {
  title: string;
  description?: string;
  fields?: Field[];
  initial?: Record<string, unknown>;
  command: Omit<Command, "reason" | "data"> & {
    data?: Record<string, unknown>;
  };
  buildData?: (data: Record<string, unknown>) => Record<string, unknown>;
  children?: React.ReactNode;
  variant?: "default" | "outline" | "destructive";
  onSuccess?: (result?: unknown) => void;
  refreshOnSuccess?: boolean;
  execute?: (payload: {
    command: Command;
    operation_id: string;
    confirmation_id: string;
  }) => Promise<void>;
}) {
  const router = useRouter();
  const formId = useId();
  const [draft, setDraft] = useState<Record<string, unknown>>(initial);
  const [openedCommand, setOpenedCommand] = useState(command);
  const [draftReason, setDraftReason] = useState("");
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState<{
      command: Command;
      operation_id: string;
    }>(),
    [actors, setActors] = useState<Option[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    fetch("/api/options/mechanics")
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw Error(b.error);
        setActors(b.data);
      })
      .catch((e) => setError(e.message));
  }, [open]);
  async function submit(form: HTMLFormElement) {
    setBusy(true);
    setError("");
    const f = new FormData(form);
    try {
      let saved: unknown;
      const r = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pending,
          pin: f.get("pin"),
          mechanic_id: f.get("mechanic_id"),
        }),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      if (execute) {
        await execute({ ...pending!, confirmation_id: b.confirmation_id });
      } else {
        const result = await fetch("/api/operations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...pending,
            confirmation_id: b.confirmation_id,
          }),
        });
        const response = await result.json();
        if (!result.ok) throw Error(response.error);
        saved = response.data;
      }
      setOpen(false);
      setPending(undefined);
      onSuccess?.(saved);
      if (refreshOnSuccess) router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na operação");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        variant={variant}
        onClick={() => {
          setDraft(initial);
          setOpenedCommand(command);
          setDraftReason("");
          setOpen(true);
          setPending(undefined);
          setError("");
        }}
      >
        {children ?? title}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!busy) setOpen(v);
        }}
      >
        <DialogContent>
          <DialogTitle>{pending ? "Confirmar alteração" : title}</DialogTitle>
          <DialogDescription>
            {description ??
              "Esta alteração será registrada no histórico do hangar."}
          </DialogDescription>
          {pending ? (
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                void submit(e.currentTarget);
              }}
            >
              <div className="confirmation-summary">
                <strong>{title}</strong>
                <p>{pending.command.reason}</p>
                <dl>
                  {Object.entries(pending.command.data ?? {}).map(([k, v]) => (
                    <div key={k}>
                      <dt>{fields.find((f) => f.key === k)?.label ?? k}</dt>
                      <dd>{label(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <label htmlFor={formId + "-actor"}>Responsável informado</label>
                <select
                  id={formId + "-actor"}
                  name="mechanic_id"
                  required
                  defaultValue=""
                >
                  <option value="">Escolha o responsável</option>
                  {actors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
              <label>
                Redigite a senha geral
                <input
                  type="password"
                  name="pin"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  minLength={4}
                  maxLength={4}
                  autoComplete="off"
                />
              </label>
              <p className="fine-print">
                Identificação autodeclarada, sem equivalência a assinatura
                técnica. Confirmação válida por dois minutos.
              </p>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="form-actions">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setPending(undefined)}
                >
                  Revisar
                </Button>
                <Button disabled={busy || !actors.length}>
                  {busy ? "Confirmando…" : "Confirmar e registrar"}
                </Button>
              </div>
            </form>
          ) : (
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                const f = new FormData(e.currentTarget);
                const values = valuesFromForm(fields, f);
                setDraft(values);
                setDraftReason(String(f.get("reason")));
                setPending({
                  operation_id: crypto.randomUUID(),
                  command: {
                    ...openedCommand,
                    data: {
                      ...openedCommand.data,
                      ...(buildData ? buildData(values) : values),
                    },
                    reason: String(f.get("reason")),
                  },
                });
              }}
            >
              {fields.map((field) => (
                <div key={field.key}>
                  <label htmlFor={formId + "-" + field.key}>
                    {field.label}
                    {field.required && <span aria-hidden="true"> *</span>}
                  </label>
                  <FieldInput
                    field={field}
                    value={draft[field.key]}
                    inputId={formId + "-" + field.key}
                  />
                </div>
              ))}
              <label>
                Motivo / resumo da alteração
                <textarea
                  name="reason"
                  required
                  minLength={3}
                  maxLength={2000}
                  rows={2}
                  placeholder="Descreva o motivo para o histórico."
                  defaultValue={draftReason}
                />
              </label>
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <Button>Revisar e confirmar</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
