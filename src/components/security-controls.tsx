"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
type Device = {
  id: string;
  label: string;
  revoked_at: string | null;
  last_seen_at: string | null;
};
export function SecurityControls() {
  const router = useRouter();
  const [error, setError] = useState(""),
    [ready, setReady] = useState(false),
    [devices, setDevices] = useState<Device[]>([]),
    [busy, setBusy] = useState(false);
  async function command(
    action: string,
    pin: string,
    code?: string,
    device_id?: string,
  ) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, pin, code, device_id }),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      if (action === "elevate") {
        setReady(true);
        const d = await fetch("/api/security");
        if (d.ok) setDevices((await d.json()).data);
      } else {
        router.refresh();
        setReady(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card stack">
      <h2>Acesso administrativo protegido</h2>
      <p>
        Exportações e alterações de segurança exigem confirmação independente,
        válida por cinco minutos. O código temporário é fornecido pelo canal
        administrativo.
      </p>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          await command("elevate", String(f.get("pin")), String(f.get("code")));
          form.reset();
        }}
      >
        <label>
          Senha geral
          <input
            type="password"
            name="pin"
            pattern="[0-9]{4}"
            required
            maxLength={4}
            autoComplete="off"
          />
        </label>
        <label>
          Código administrativo
          <input
            type="password"
            name="code"
            required
            minLength={43}
            maxLength={43}
            autoComplete="off"
          />
        </label>
        <Button disabled={busy}>Confirmar acesso administrativo</Button>
      </form>
      {ready && (
        <>
          <p role="status">
            Acesso administrativo confirmado por cinco minutos.
          </p>
          <ul>
            {devices.map((d) => (
              <li key={d.id}>
                {d.label} · {d.revoked_at ? "Revogado" : "Ativo"}
                {!d.revoked_at && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await command(
                        "revoke_device",
                        String(new FormData(e.currentTarget).get("pin")),
                        undefined,
                        d.id,
                      );
                    }}
                  >
                    <label>
                      Senha para revogar
                      <input
                        name="pin"
                        type="password"
                        pattern="[0-9]{4}"
                        maxLength={4}
                        required
                      />
                    </label>
                    <Button disabled={busy} variant="destructive">
                      Revogar aparelho
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await command(
                "revoke_sessions",
                String(new FormData(e.currentTarget).get("pin")),
              );
            }}
          >
            <label>
              Senha para encerrar sessões
              <input
                name="pin"
                type="password"
                pattern="[0-9]{4}"
                maxLength={4}
                required
              />
            </label>
            <Button disabled={busy} variant="destructive">
              Encerrar todas as sessões
            </Button>
          </form>
        </>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </section>
  );
}
