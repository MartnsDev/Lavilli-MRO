"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { useHydrated } from "@/lib/use-hydrated";
import type { AccessState } from "@/lib/domain/access";
export function LoginForm({ initialState }: { initialState: AccessState }) {
  const router = useRouter();
  const ready = useHydrated();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [showPin, setShowPin] = useState(false);
  if (!initialState.deviceAuthorized)
    return (
      <div className="access-form-content">
        <span className="access-eyebrow">ACESSO PRIVADO</span>
        <h1>Autorizar este aparelho</h1>
        <p className="access-description">
          Use o código temporário fornecido pela administração. Esta etapa
          acontece apenas na autorização inicial.
        </p>
        <form
          method="post"
          className="access-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            const code = String(new FormData(event.currentTarget).get("code"));
            try {
              const r = await fetch("/api/auth/enroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
              });
              const b = await r.json();
              if (!r.ok) throw Error(b.error);
              router.refresh();
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Não foi possível validar o acesso.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="access-field">
            <label htmlFor="enroll-code">
              Código administrativo temporário
            </label>
            <input
              id="enroll-code"
              type="password"
              name="code"
              autoComplete="off"
              required
              minLength={43}
              maxLength={43}
            />
          </div>
          {error && (
            <p role="alert" className="access-error">
              {error}
            </p>
          )}
          <Button
            disabled={!ready || busy || !initialState.infrastructureReady}
          >
            {busy ? "Validando…" : "Autorizar acesso"}
          </Button>
        </form>
      </div>
    );
  return (
    <div className="access-form-content">
      <span className="access-eyebrow">GESTÃO DO HANGAR</span>
      <h1>Bem-vindo à Lavilli</h1>
      <p className="access-description">
        Selecione seu nome e entre com a senha do hangar.
      </p>
      <form
        method="post"
        className="access-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          const form = new FormData(event.currentTarget);
          try {
            const response = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mechanic_id: form.get("mechanic_id"),
                pin: form.get("pin"),
              }),
            });
            const body = await response.json();
            if (!response.ok) throw Error(body.error);
            router.replace("/dashboard");
            router.refresh();
          } catch (error) {
            setError(
              (error as Error).message ||
                "Não foi possível entrar. Tente novamente.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="access-field">
          <label htmlFor="login-mechanic">Quem está acessando?</label>
          <select
            id="login-mechanic"
            name="mechanic_id"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Selecione seu nome
            </option>
            {initialState.mechanics.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="access-field">
          <label htmlFor="access-pin">Senha do hangar</label>
          <div className="access-pin-wrap">
            <input
              id="access-pin"
              name="pin"
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]{4}"
              minLength={4}
              maxLength={4}
              required
              autoComplete="off"
              placeholder="••••"
              className="access-pin"
            />
            <button
              type="button"
              className="access-pin-eye"
              aria-label={showPin ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPin(!showPin)}
            >
              {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {error && (
          <p className="access-error" role="alert">
            {error}
          </p>
        )}
        <Button
          className="access-submit"
          disabled={
            !ready ||
            busy ||
            !initialState.infrastructureReady ||
            !initialState.passwordConfigured ||
            !initialState.mechanics.length
          }
        >
          {busy ? "Entrando…" : "Entrar no hangar"}
          {!busy && <ArrowRight size={17} />}
        </Button>
      </form>
    </div>
  );
}
