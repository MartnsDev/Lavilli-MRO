import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
export function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "INTERNAL";
  const map: Record<string, [number, string]> = {
    UNAUTHORIZED: [401, "Entre novamente para continuar."],
    FORBIDDEN: [403, "Operação não autorizada."],
    CSRF: [403, "Origem da requisição inválida."],
    INVALID_PIN: [403, "Senha ou confirmação inválida."],
    RATE_LIMIT: [429, "Muitas tentativas. Aguarde 15 minutos."],
    SETUP_REQUIRED: [503, "Configuração do servidor pendente."],
    CONFLICT: [
      409,
      "Registro alterado por outra operação, revise antes de salvar.",
    ],
    UNAVAILABLE: [
      409,
      "Item indisponível ou com condição/documentação pendente.",
    ],
    INSUFFICIENT_STOCK: [409, "Saldo disponível insuficiente."],
    INVALID_OPERATION: [400, "Operação inválida. Confira os campos."],
    NOT_FOUND: [404, "Registro não encontrado."],
    EMAIL_DISABLED: [503, "O envio de e-mail ainda não está configurado."],
  };
  const [status, message] =
    error instanceof ZodError
      ? [400, error.issues.map((i) => i.message).join("; ")]
      : (map[code] ?? [
          500,
          "Não foi possível concluir a operação. Consulte o suporte.",
        ]);
  if (status === 500)
    console.error(
      JSON.stringify({
        event: "request_failed",
        code: "INTERNAL",
        at: new Date().toISOString(),
      }),
    );
  return NextResponse.json({ error: message }, { status });
}
