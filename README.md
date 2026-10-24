# Lavilli Jet | Gestão do Hangar

Aplicação operacional de hangar em português, construída neste repositório. Next.js App Router, React, TypeScript estrito, Tailwind, componentes no padrão shadcn/Radix, PostgreSQL/Supabase e Storage privado. Não emite certificação, assinatura técnica oficial ou autorização para retorno ao serviço.

## Executar

```bash
npm ci --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000. Sem configuração, o painel redireciona a `/setup`; não há banco fictício nem modo de demonstração. Para operar, configure Supabase e os segredos descritos em [deploy](docs/deployment.md). Não coloque a senha neste repositório ou no chat.

## Verificar

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run check:secrets
# Em outro terminal, com npm run dev ativo:
npm run test:e2e
# Exige navegador Chromium instalado para o Playwright:
npm run test:ui
# Exige PostgreSQL ISOLADO com ferramentas cliente; nunca use produção:
RUN_DATABASE_TESTS=1 PGHOST=localhost PGPORT=55439 npm run test:db
```

O teste de banco cria e remove apenas bancos com prefixo `lavilli_test_`. O teste de Storage real, de OTP e de e-mail exige um projeto Supabase de homologação e configuração Resend. Nenhum e-mail foi enviado nesta implementação.

## Implementado

- Dispositivos autorizados por código de recuperação de alta entropia, de uso único, ou OTP enviado ao e-mail fixo da empresa; sessões opacas assinadas, HttpOnly, expiração e revogação.
- Senha geral com Argon2id; cada alteração operacional requer responsável informado e reconfirmação vinculada ao conteúdo, válida por dois minutos. Limites persistentes de tentativas.
- Cadastros, localizações hierárquicas, catálogo e peças serializadas; lotes, recebimentos, reservas, consumo, transferência, baixa e inventário com conciliação.
- Ferramentas, kits, conferência de saída/retorno, ocorrências e registros de calibração; bloqueios de disponibilidade no banco.
- Aeronaves, histórico de matrícula, tarefas independentes, vínculo posterior a OS e encerramento administrativo; remessas, custódia e retornos parciais.
- Biblioteca de referências e versões privadas de arquivos, QR/etiquetas, importação com prévia e mapeamento, relatórios CSV/PDF, painel real e auditoria append-only.
- Geração de alertas, outbox deduplicada e worker Resend com lease e backoff; execução periódica requer configuração externa.

## Status e limites

A build e os testes locais são a referência de validação; integração real não é comprovada sem homologação. **O escopo integral do prompt ainda possui itens parciais**, inclusive atualização de cadastros por importação, planejamento dedicado de materiais, homologação da câmera, calibração com certificado obrigatório vinculado e filtros avançados de relatórios. Consulte o [checklist verificável](docs/implementation-plan.md) e as [limitações](docs/limitations-and-compliance.md).

Documentação: [arquitetura](docs/architecture.md), [banco](docs/database.md), [segurança](docs/security.md), [operação](docs/operations.md), [decisões](docs/decisions.md), [backup e restauração](docs/backup-restore.md), [manual](docs/manual-usuario.md), [cenários de teste](docs/test-matrix.md), [versões instaladas](docs/versions.md).
