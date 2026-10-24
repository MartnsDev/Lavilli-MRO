"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  initialAccessMode,
  type AccessState,
  type AccessMode,
} from "@/lib/domain/access";

class AccessError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}
export function LoginForm({ initialState }: { initialState: AccessState }) {
  const router = useRouter();
  const [state, setState] = useState(initialState),
    [mode, setMode] = useState<AccessMode>(initialAccessMode(initialState)),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [showPin, setShowPin] = useState(false),
    [challenge, setChallenge] = useState<string>(),
    [recoveryCode, setRecoveryCode] = useState("");
  async function post(action: string, body: unknown) {
    const response = await fetch("/api/auth/" + action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new AccessError(result.error, result.code);
    return result;
  }
  function change(next: AccessMode) {
    setMode(next);
    setError("");
    setNotice("");
    setShowPin(false);
  }
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/status", { cache: "no-store" });
      if (!response.ok)
        throw Error("Não foi possível consultar a configuração.");
      const next = (await response.json()) as AccessState;
      setState(next);
      setMode(initialAccessMode(next));
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const title =
    mode === "initialize"
      ? "Defina a senha do hangar"
      : mode === "bootstrap"
        ? "Autorize este dispositivo"
        : mode === "email"
          ? "Confira seu e-mail"
          : mode === "unavailable"
            ? "Preparação do acesso"
            : "Bom ter você por aqui";
  const description =
    mode === "initialize"
      ? "Use o código privado de primeiro acesso para definir a senha geral de quatro dígitos."
      : mode === "bootstrap"
        ? "Este navegador ainda não foi autorizado. Use o código fornecido pelo proprietário para continuar."
        : mode === "email"
          ? "Digite o código recebido no e-mail autorizado da empresa."
          : mode === "unavailable"
            ? "O acesso precisa de uma etapa de configuração pelo proprietário."
            : "Entre com a senha geral para acompanhar a operação.";
  return (
    <div className="access-form-content">
      <span className="access-eyebrow">
        {mode === "login"
          ? "ACESSO À OPERAÇÃO"
          : mode === "initialize"
            ? "PRIMEIRO ACESSO · 01 / 02"
            : "ACESSO SEGURO AO HANGAR"}
      </span>
      <h1>{title}</h1>
      <p className="access-description">{description}</p>
      {mode === "unavailable" ? (
        <div className="access-setup-notice">
          <KeyRound size={21} />
          <div>
            <strong>
              {!state.infrastructureReady
                ? "Conexão do servidor pendente"
                : state.passwordConfigured
                  ? "Revise a configuração da senha"
                  : "A senha geral ainda não foi definida"}
            </strong>
            <p>
              {!state.infrastructureReady
                ? "Configure a conexão com o Supabase e os segredos do servidor."
                : "No computador do projeto, execute npm run configure:pin. Em uma hospedagem, configure PIN_HASH no ambiente seguro."}
            </p>
          </div>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void refresh()}
          >
            <RefreshCw size={15} /> Já configurei, atualizar
          </Button>
        </div>
      ) : (
        <form
          className="access-form"
          key={mode}
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setNotice("");
            setBusy(true);
            const values = new FormData(event.currentTarget);
            try {
              if (mode === "login") {
                await post("login", { pin: values.get("pin") });
                router.replace("/dashboard");
                router.refresh();
              } else if (mode === "initialize") {
                const code = String(values.get("code")).trim();
                setRecoveryCode(code);
                await post("initialize", {
                  code,
                  pin: values.get("pin"),
                  pin_confirmation: values.get("pin_confirmation"),
                });
                setState({ ...state, passwordConfigured: true });
                setMode("bootstrap");
                setShowPin(false);
                setNotice(
                  "Senha definida. Agora dê um nome e autorize este dispositivo.",
                );
              } else {
                await post("enroll", {
                  code: String(values.get("code")).trim(),
                  label: values.get("label"),
                  bootstrap: mode === "bootstrap",
                  ...(challenge ? { challenge } : {}),
                });
                setState({ ...state, deviceAuthorized: true });
                setRecoveryCode("");
                setMode("login");
                setNotice(
                  "Dispositivo autorizado. Entre com a senha do hangar.",
                );
              }
            } catch (e) {
              const failure = e as AccessError;
              if (failure.code === "PIN_CONFIGURATION_INVALID") {
                setMode("unavailable");
                setError(failure.message);
              } else if (failure.code === "PIN_ALREADY_CONFIGURED") {
                setState({ ...state, passwordConfigured: true });
                setMode("bootstrap");
                setNotice(
                  "A senha já está definida. Continue autorizando este dispositivo.",
                );
              } else if (failure.code === "DEVICE_REQUIRED") {
                setState({ ...state, deviceAuthorized: false });
                setMode("bootstrap");
                setError(failure.message);
              } else if (failure.code === "PIN_NOT_CONFIGURED") {
                setState({ ...state, passwordConfigured: false });
                setMode(state.localSetupEnabled ? "initialize" : "unavailable");
                setError(failure.message);
              } else
                setError(
                  failure.message ||
                    "Não foi possível concluir o acesso. Tente novamente.",
                );
            } finally {
              setBusy(false);
            }
          }}
        >
          {(mode === "initialize" ||
            mode === "bootstrap" ||
            mode === "email") && (
            <>
              {mode !== "initialize" && (
                <div className="access-field">
                  <label htmlFor="device-label">Nome deste dispositivo</label>
                  <input
                    id="device-label"
                    name="label"
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="Ex.: Tablet da oficina"
                    autoComplete="off"
                  />
                </div>
              )}
              <div className="access-field">
                <label htmlFor="access-code">
                  {mode === "email"
                    ? "Código recebido por e-mail"
                    : mode === "initialize"
                      ? "Código de primeiro acesso"
                      : "Código de recuperação"}
                </label>
                <input
                  id="access-code"
                  name="code"
                  type="password"
                  required
                  minLength={mode === "email" ? 6 : 32}
                  maxLength={200}
                  defaultValue={mode === "email" ? "" : recoveryCode}
                  autoComplete="off"
                  aria-describedby={
                    mode === "email" ? undefined : "recovery-hint"
                  }
                />
                {mode !== "email" && (
                  <details className="access-code-help" id="recovery-hint">
                    <summary>Onde encontro esse código?</summary>
                    <p>
                      O proprietário encontra o código privado no arquivo{" "}
                      <code>.local-secrets/device-bootstrap.txt</code>, no
                      computador onde o sistema foi configurado. Ele é diferente
                      da senha de quatro dígitos.
                    </p>
                  </details>
                )}
              </div>
            </>
          )}
          {(mode === "login" || mode === "initialize") && (
            <div className="access-field">
              <label htmlFor="access-pin">
                {mode === "initialize" ? "Defina a senha geral" : "Senha geral"}
              </label>
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
          )}
          {mode === "initialize" && (
            <div className="access-field">
              <label htmlFor="access-pin-confirm">Repita a senha geral</label>
              <input
                id="access-pin-confirm"
                name="pin_confirmation"
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
            </div>
          )}
          {error && (
            <p role="alert" className="access-error">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="access-success">
              <CheckCircle2 size={16} />
              {notice}
            </p>
          )}
          <Button className="access-submit" disabled={busy}>
            {busy
              ? "Aguarde um instante…"
              : mode === "initialize"
                ? "Definir senha e continuar"
                : mode === "login"
                  ? "Entrar no hangar"
                  : "Autorizar dispositivo"}
            {!busy && <ArrowRight size={17} />}
          </Button>
        </form>
      )}
      {mode === "unavailable" && error && (
        <p role="alert" className="access-error">
          {error}
        </p>
      )}
      {mode !== "unavailable" && (
        <div className="access-secondary-actions">
          {mode === "login" && state.recoveryAvailable && (
            <button
              type="button"
              onClick={() => change("bootstrap")}
              disabled={busy}
            >
              Primeiro acesso ou novo dispositivo <ArrowRight size={13} />
            </button>
          )}
          {mode === "bootstrap" && state.emailEnabled && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const response = await post("request-code", {});
                  setChallenge(response.challenge);
                  change("email");
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Receber um código por e-mail <ArrowRight size={13} />
            </button>
          )}
          {(mode === "bootstrap" || mode === "email") && (
            <button
              type="button"
              disabled={busy}
              onClick={() => change("login")}
            >
              <ArrowLeft size={13} /> Já autorizei este dispositivo
            </button>
          )}
          {mode === "initialize" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void refresh()}
            >
              <RefreshCw size={13} /> Já defini a senha no terminal
            </button>
          )}
        </div>
      )}
      <div className="access-trust">
        <span className="access-trust-dot" />{" "}
        {mode === "login" && state.deviceAuthorized
          ? "Dispositivo autorizado · conexão protegida"
          : "Acesso exclusivo a dispositivos autorizados"}
      </div>
    </div>
  );
}
