"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
export function SecurityControls() {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <section className="card stack">
      <h2>Sessões de acesso</h2>
      <p>Use a senha geral para encerrar as sessões abertas.</p>
      <form
        method="post"
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const r = await fetch("/api/security", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "revoke_sessions",
                pin: String(new FormData(e.currentTarget).get("pin")),
              }),
            });
            const b = await r.json();
            if (!r.ok) throw Error(b.error);
            router.replace("/login");
            router.refresh();
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Não foi possível concluir.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Senha geral
          <input
            name="pin"
            type="password"
            pattern="[0-9]{4}"
            minLength={4}
            maxLength={4}
            required
            autoComplete="off"
          />
        </label>
        <Button disabled={busy} variant="destructive">
          Encerrar todas as sessões
        </Button>
      </form>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </section>
  );
}
