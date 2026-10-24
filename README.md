# Lavilli Control

Implementação em revisão; **não publicado em produção**. Relatórios atuais: [segurança](SECURITY_AUDIT.md), [checklist](SECURITY_CHECKLIST.md), [release](docs/RELEASE_READINESS.md), [visual](VISUAL_AUDIT.md), [responsividade](RESPONSIVE_TEST_REPORT.md), [deploy](docs/DEPLOY_GUIDE.md) e [apresentação](docs/DEMO_LAVILLI_JET.md).

Demo local: após `npm run test:full`, executar `npm run demo:prepare` e depois `npm run demo:local`. Dados fictícios, e-mail desativado e backend obrigatoriamente local. Credenciais temporárias em arquivo privado, nunca no README. Auto deploy Git Vercel desativado em vercel.json; publicação exige autorização explícita.

## Aplicação

Aplicação operacional de hangar em português, construída neste repositório. Next.js App Router, React, TypeScript estrito, Tailwind, componentes no padrão shadcn/Radix, PostgreSQL/Supabase e Storage privado. Não emite certificação, assinatura técnica oficial ou autorização para retorno ao serviço.

## Executar

```bash
npm ci --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000. Conforme a auditoria de segurança posterior, autorize cada aparelho uma vez com código independente emitido pelo operador (`npm run security:grant`). Depois, o acesso diário pede o mecânico e a senha geral. Operações administrativas exigem elevação independente de cinco minutos. A migration 009 precisa estar aplicada no backend antes de usar o código novo; ela ainda não foi promovida ao banco remoto.

Em uma instalação nova, configure as variáveis de infraestrutura e use `npm run configure:pin` para salvar o hash da senha escolhida. Consulte [deploy](docs/deployment.md). O arquivo `.env.local` permanece privado.

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

## Verificação funcional completa

```bash
# Docker precisa estar disponível. Este comando inicia apenas o Supabase LOCAL:
npx --yes supabase@2.122.0 start --exclude studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,inbucket
# Migrações, regras, concorrência e dump/restore em banco descartável:
npm run test:db:docker
# API real + Storage privado + formulários no computador e celular:
npm run test:full
```

A suíte completa usa uma build separada em `.next-verification`, porta 3100 e senha aleatória de teste. Não usa as credenciais do Supabase remoto e não altera a senha real. Exige Chrome instalado ou `PLAYWRIGHT_CHANNEL=chromium` com `npx playwright install chromium`. O relatório fica em `playwright-report/full/index.html`. Veja [a cobertura atual](docs/RELEASE_READINESS.md) e [os resultados registrados](docs/verification-results.json). O workflow do GitHub executa essas verificações em pushes e pull requests.

## Implementado

- Autorização inicial independente de aparelho; acesso diário com mecânico e senha compartilhada. Sessões opacas, HttpOnly, revogação, inatividade e máximo de oito horas.
- Senha geral com Argon2id; cada alteração operacional requer responsável informado e reconfirmação vinculada ao conteúdo, válida por dois minutos. Limites persistentes de tentativas.
- Cadastros, localizações hierárquicas, catálogo e peças serializadas; lotes, recebimentos, reservas, consumo, transferência, baixa e inventário com conciliação.
- Ferramentas, kits, conferência de saída/retorno, ocorrências e registros de calibração; bloqueios de disponibilidade no banco.
- Aeronaves, histórico de matrícula, tarefas independentes, vínculo posterior a OS e encerramento administrativo; remessas, custódia e retornos parciais.
- Biblioteca privada com versões em quarentena e proxy autenticado, QR/etiquetas, importação com original privado, prévia e mapeamento, relatórios CSV/PDF com elevação, painel real e auditoria append-only.
- Geração de alertas, outbox deduplicada e worker Resend com lease e backoff; execução periódica requer configuração externa.

## Status e limites

A build e os testes locais são a referência de validação; integração real não é comprovada sem homologação. **O escopo integral do prompt ainda possui itens parciais**, inclusive atualização de cadastros por importação, planejamento dedicado de materiais, homologação da câmera, calibração com certificado obrigatório vinculado e filtros avançados de relatórios. Consulte o [checklist verificável](docs/implementation-plan.md) e as [limitações](docs/limitations-and-compliance.md).

Documentação: [arquitetura](docs/architecture.md), [banco](docs/database.md), [segurança](docs/security.md), [operação](docs/operations.md), [decisões](docs/decisions.md), [backup e restauração](docs/backup-restore.md), [manual](docs/manual-usuario.md), [cenários de teste](docs/test-matrix.md), [versões instaladas](docs/versions.md).

Configuração do projeto Supabase e verificações remotas: [status da infraestrutura](docs/infrastructure-setup.md).
