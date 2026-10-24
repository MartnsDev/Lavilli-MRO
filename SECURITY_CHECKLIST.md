# Checklist de segurança

24/10/2026 — implementação local; produção não certificada.

- [x] Documentos de requisitos lidos integralmente; projeto e repositório identificados.
- [x] Banco remoto inspecionado apenas em leitura: 42 tabelas, oito migrations preservadas.
- [x] Aparelhos legados não herdam confiança; registros preservados, nova autorização obrigatória.
- [x] Autorização independente de dispositivo, uso único e expiração.
- [x] PIN Argon2id; limite persistente e confirmação de operações.
- [x] Aba visível sem interação solicita logout em 30 minutos; teste com relógio acelerado, cookie removido e API negada.
- [x] Sessões vinculadas a dispositivo/credencial, inatividade, máximo e revogação.
- [x] Elevação administrativa com código independente.
- [x] RLS/grants/schema/defaults/RPC endurecidos na migration 009 local.
- [x] Negação de CRUD/UPSERT nas 42 tabelas para anon/authenticated em banco descartável.
- [x] 42 consultas anônimas remotas limit=0 negadas, sem ler dados.
- [x] CSRF, payload efetivo, limites, erros e cookies malformados.
- [x] CSP com nonce, cache privado e cabeçalhos.
- [x] Proxy privado de documentos e quarentena obrigatória.
- [x] Importação original preservada, ZIP limitado, CSV seguro e exportação auditada.
- [x] Transações, versões, idempotência e três testes concorrentes SQL.
- [x] Auditoria imutável no papel do app, responsabilidade declarada preservada.
- [x] Cron com lease e segredo, e-mails desativados nos testes.
- [x] Backup criptografado, teste de autenticação/tampering e dump/restore PostgreSQL.
- [x] 176 testes integrados + seis regressões complementares aprovados; 177 casos distintos.
- [x] 1.104 medições responsivas, dois temas, zero overflow da página/erros coletados.
- [x] 43 testes unitários aprovados; npm audit sem vulnerabilidades conhecidas.
- [x] Busca de quatro segredos reais em fontes/histórico/bundle sem exposição encontrada.
- [x] Dry-run remoto: apenas 009 pendente, nenhuma migration aplicada.
- [ ] Aprovar/aplicar migration 009 no projeto remoto após plano de backup e revisão.
- [ ] Configurar scanner operacional/atualização de assinaturas e testar malware inofensivo de ensaio em homologação.
- [ ] Configurar backup externo automatizado e retenção; guardar chave separada.
- [ ] Comprovar recuperação integral banco + Storage + aplicação dentro de RPO 24h/RTO 4h.
- [ ] Autorizar backend isolado de Preview; configurar proteção Vercel e variáveis por ambiente.
- [ ] Validar envio real, domínio de e-mail, reexecução de jobs e alertas externos em homologação.
- [ ] Substituir credencial compartilhada anteriormente exposta, sem publicá-la em relatórios.
- [ ] Validar retenção, incidentes, responsáveis, monitoramento e obrigações de privacidade com a Lavilli.
- [ ] Autorização explícita do proprietário para produção.

Resultados de navegador e decisão de release: [RELEASE_READINESS](docs/RELEASE_READINESS.md) e [RESPONSIVE_TEST_REPORT](RESPONSIVE_TEST_REPORT.md). Itens pendentes impedem declarar produção segura.

- [ ] Validar os recursos parciais de produto e os procedimentos técnicos, inclusive conferência de certificados de calibração, antes do aceite de produção.
