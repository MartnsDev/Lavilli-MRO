"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "enroll" | "bootstrap">("login"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [challenge, setChallenge] = useState<string>();
  async function post(action: string, body: unknown) {
    const r = await fetch("/api/auth/" + action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await r.json();
    if (!r.ok) throw new Error(result.error);
    return result;
  }
  return (
    <>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setBusy(true);
          const form = new FormData(e.currentTarget);
          try {
            if (mode === "login") {
              await post("login", { pin: form.get("pin") });
              router.replace("/dashboard");
              router.refresh();
            } else {
              await post("enroll", {
                code: form.get("code"),
                label: form.get("label"),
                bootstrap: mode === "bootstrap",
                ...(challenge ? { challenge } : {}),
              });
              setMode("login");
              setChallenge(undefined);
            }
          } catch (e) {
            setError(e instanceof Error ? e.message : "Falha no acesso");
          } finally {
            setBusy(false);
          }
        }}
      >
        {mode === "login" ? (
          <label>
            Senha geral
            <input
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              minLength={4}
              maxLength={4}
              required
              autoComplete="off"
              placeholder="••••"
              className="pin-input"
            />
          </label>
        ) : (
          <>
            <label>
              Nome deste dispositivo
              <input
                name="label"
                required
                maxLength={100}
                placeholder="Ex.: Tablet da oficina"
              />
            </label>
            <label>
              {mode === "bootstrap"
                ? "Código de recuperação"
                : "Código recebido por e-mail"}
              <input
                name="code"
                type="password"
                required
                minLength={mode === "bootstrap" ? 32 : 6}
                autoComplete="off"
              />
            </label>
          </>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <Button disabled={busy}>
          {busy
            ? "Verificando…"
            : mode === "login"
              ? "Entrar no hangar"
              : "Autorizar dispositivo"}
        </Button>
      </form>
      <div className="auth-links">
        {mode !== "login" && (
          <Button variant="ghost" onClick={() => setMode("login")}>
            Voltar ao acesso
          </Button>
        )}
        {mode === "login" && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const r = await post("request-code", {});
                setChallenge(r.challenge);
                setMode("enroll");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Autorizar novo dispositivo por e-mail
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            setMode(mode === "bootstrap" ? "login" : "bootstrap");
            setError("");
          }}
        >
          Primeiro acesso / recuperação
        </Button>
      </div>
    </>
  );
}
