> Atualização do acesso: o fluxo atual usa somente César ou Maranhão e a senha geral pré-configurada, com entrada direta no dashboard. Referências abaixo a bootstrap, OTP ou autorização de dispositivos são históricas e foram substituídas por `202610240007_shared_login.sql`. Consulte o manual e deployment atuais.

# Operação e manutenção

## Rotina

Verifique `/api/health` com sessão autorizada e a lista Entregas de e-mail em Configurações. O endpoint de saúde não é público. Registre horário da última execução do agendador em seu monitor externo; o sistema não configura um serviço pago automaticamente.

O job é `POST /api/jobs` com `Authorization: Bearer <CRON_SECRET>`, em HTTPS. Configure um agendador que suporte POST e segredo; uma frequência inicial de 15min pode ser revisada conforme necessidade e custos. Não ponha segredo em query string ou URL. Não há configuração Vercel Cron automática: cron nativo GET não deve ser apontado para este POST sem adaptação segura.

Job gera alertas no banco sem depender de Resend. E-mail fica desativado com EMAIL_MODE=disabled. Para ativar, homologue domínio remetente e destinatários, configure Resend e ao menos uma regra ativa com envio habilitado. Não ative em testes. A outbox usa chave por alerta/destinatário, até seis tentativas, backoff exponencial e lease de cinco minutos. O worker pega dez registros por execução; ajuste frequência e orçamento antes de aumentar.

Falhas do processo podem deixar e-mail entregue sem atualização local. A mesma idempotency key é enviada ao provedor; a retenção dessa chave depende do contrato do provedor. Não prometer exactly-once absoluto. Falhas finais ficam visíveis e exigem investigação de infraestrutura; a interface não tem botão de reenvio manual.

## Manutenção

- Execute checks e testes antes de mudanças. Consulte o lockfile e docs/versions.md.
- Aplique migrations novas apenas após revisão/backup. Nunca rode `supabase db reset` contra dados reais.
- Revise periodicamente dispositivos, destinatários e responsáveis ativos. Não apague responsáveis com histórico.
- Faça backup externo de banco e objetos; teste restauração em destino isolado.
- Não remova auditoria manualmente. A política de retenção deve ser validada e implementada em mudança própria antes de qualquer expurgo.
- Limpeza de access_attempts, sessões expiradas, challenges, confirmações e operation_results exige política aprovada; não existe expurgo automático nesta versão. Manter resultados de idempotência pelo período de retry acordado.
- A conciliação de Storage deve comparar `document_versions.object_path` com objetos do bucket antes de qualquer remoção. Scripts não removem objetos automaticamente.

## Recuperação

Em perda de todos os dispositivos, acesse o ambiente de infraestrutura com MFA, gere novo código de alta entropia, substitua DEVICE_BOOTSTRAP_HASH e use a tela Primeiro acesso. Código antigo consumido não pode ser reutilizado. Revogue dispositivos perdidos. Para rotacionar o PIN, gere novo hash com entrada oculta, atualize PIN_HASH e revogue sessões/dispositivos conforme o incidente. Rotacionar SESSION_SECRET invalida os cookies existentes e exige nova autorização de dispositivos; prepare recuperação antes.
