# Plano e status verificável

Cada marca descreve código existente; testes integrados a serviços externos continuam pendentes. Os módulos são interligados por UUIDs, transações SQL e auditoria.

## Fase 1 — fundação

- [x] Next App Router, React, TS strict, Tailwind e componentes acessíveis Radix/shadcn.
- [x] Layout responsivo, busca, breadcrumbs, tema persistente, estados vazios e navegação.
- [x] Ambiente exemplificado, lint, formatador, Vitest, Playwright e documentação.
- [x] Revisão visual do novo acesso em Chrome automatizado, desktop 1280×900 e mobile 390×844; quatro testes de interface e capturas.
- [ ] Revisão de todas as telas operacionais autenticadas e tablet.

## Fase 2 — banco e segurança

- [x] 42 tabelas, FKs, constraints, índices, migrations aditivas e RLS/grants fechados.
- [x] PIN Argon2id, sessão opaca assinada, cookie seguro, CSRF por Origin e tentativas persistentes.
- [x] Autorização de dispositivo por bootstrap de uso único ou OTP; expiração/revogação.
- [x] Confirmação de mutations vinculada a conteúdo/operação/sessão/responsável; expiração e antirreplay.
- [x] Auditoria por triggers; segredos em tabelas separadas, sem payloads de credenciais.
- [x] Tipos derivados do PostgreSQL em `src/lib/database.types.ts`.
- [x] Projeto Supabase real vinculado, seis migrations aplicadas após inspeção e dry-run, 42 tabelas com RLS e acesso anônimo bloqueado.
- [x] SDK com leitura administrativa real e metadados do bucket privado verificados.
- [ ] Homologar upload/versionamento real de arquivos, OTP e sessão em HTTPS.

## Fase 3 — peças e estoque

- [x] Localizações em árvore, catálogo, unidades serializadas e lotes, propriedade/condição/documentação distintas.
- [x] Recebimento, conferência, reserva/liberação/consumo, transferências e baixa, atomicidade e idempotência.
- [x] Registro de instalação/remoção e localização desconhecida; QR autenticado e impressão.
- [x] Inventário, contagem e ajuste justificado com evento compensatório e controle de divergência.
- [ ] Conversões explícitas de unidades e restrições de armazenamento configuráveis.
- [ ] Recebimento com vários itens/documentos/custos na mesma operação.

## Fase 4 — ferramentas

- [x] Patrimônio, calibração registrada, retirada/devolução e bloqueio de retirada concorrente.
- [x] Kits conferidos, itens faltantes geram ocorrência; confirmação de alerta não apaga ocorrência.
- [x] Certificado de calibração por referência textual e biblioteca privada.
- [ ] Exigir vínculo verificável de certificado privado em cada registro de calibração.
- [ ] Edição segura da composição histórica de kits (a inclusão existe; remoção pela UI não está liberada).

## Fase 5 — serviços e materiais externos

- [x] Aeronaves, histórico de matrícula, tarefas independentes, associação posterior a OS.
- [x] Transições validadas e encerramento apenas administrativo; OS não encerra com tarefas pendentes.
- [x] Remessas com múltiplos itens, despacho, rastreio informado, retorno parcial e quarentena documental.
- [x] Retiradas de ferramentas vinculáveis a tarefas/OS/aeronaves; comentários.
- [x] Movimentos de reserva/consumo vinculáveis a tarefa, OS e aeronave no próprio evento de estoque; sem duplicar saldos.
- [ ] Planejamento de materiais e acompanhamento de reservas por tarefa/OS em interface dedicada.
- [x] Fichas agregam tarefas, OS, peças instaladas, ferramentas, movimentos e documentos vinculados; listas relacionadas limitadas aos registros recentes.

## Fase 6 — documentos, importação e relatórios

- [x] Bucket privado, upload confirmado, hash, MIME/assinatura/extensão, 4 MB, versões e URL assinada de 60s.
- [x] Vínculos de documentos às fichas e referências HTTPS.
- [x] CSV/XLSX até 100 linhas, prévia, mapeamento, validação, criação/ignorar duplicados e erros por linha.
- [x] Exportação CSV com neutralização de fórmulas e PDF paginado, filtros de data/situação.
- [ ] Diff de atualização por importação, prévia de conflitos atuais e nomes de referências convertidos automaticamente em UUIDs.
- [ ] Arquivo original de importação privado opcional, relatórios assíncronos e filtros cruzados avançados.

## Fase 7 — painel e alertas

- [x] Métricas e atividades obtidas do banco; busca agrupada e paginação.
- [x] Alertas para vencimentos, atrasos, falta de estoque, ferramentas/peças não localizadas e ocorrências.
- [x] Outbox, deduplicação, lease, limite de tentativas e Resend configurável.
- [x] API de job protegida por segredo; API de saúde autenticada.
- [ ] Agendador real e envio de homologação (sem credenciais; não ativados).
- [ ] Regras distintas por tipo, várias janelas 30/15/7 e encerramento/reabertura automática de alertas.
- [ ] Busca por número de OS e relacionamento indireto por localização/aeronave além dos campos textuais.

## Fase 8 — validação e implantação

- [x] Testes unitários de segurança/importação, APIs anônimas, transações/concorrência PostgreSQL.
- [x] Runbooks, scripts de backup de banco + objetos separados e restauração em destino isolado.
- [ ] Testar backup/restore de Storage com arquivos reais e validar restauração integral em Supabase.
- [ ] Navegador para testes visuais e fluxos autenticados ponta a ponta.
- [ ] Deploy Vercel, domínio e segredos reais (não configurados).
- [x] Manifest e ícones PNG 192/512 e SVG, sem cache operacional offline.
- [ ] Verificar instalação PWA nos navegadores de destino.
- [x] Leitor QR com câmera via BarcodeDetector quando disponível; fallback manual e aceitação apenas de fichas da mesma origem.
- [ ] Homologar câmera em aparelhos reais (BarcodeDetector depende do navegador).

## Evidências da execução

- `npm run typecheck`, `npm run lint`, `npm test` e `npm run build` executados; versões e resultados finais em `docs/validation.md`.
- `npm run test:db` aplica migrations em banco descartável, testa rollback, permissões, três corridas reais e dump/restore.
- `npm run test:e2e` verifica HTTP real, sem mocks, contra o servidor local; o projeto `api` não precisa de navegador.
- `npm run test:ui` está preparado e não foi executado: nenhum navegador conectado/disponível.

Nenhuma etapa parcial está declarada como produção homologada. Novas migrations devem ser revisadas e aplicadas conscientemente; não há reset automático de produção.

## Revisão do design e correção de entrada

- [x] Layout do acesso integrado à marca, Montserrat oficial, botões dourados e logo sem bloco branco isolado.
- [x] Estado de configuração explícito, primeiro PIN pelo navegador local protegido por recuperação, autorização de dispositivo separada e botão de e-mail somente quando disponível.
- [x] Hash local portável, sem expansão de `$` pelo Next; teste do carregador real.
- [x] Testes unitários de login/negação/sessão e configuração em arquivos temporários. O PIN real do proprietário permanece sob controle do próprio proprietário.
