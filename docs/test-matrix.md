# Matriz de aceitação A–V

“SQL” significa teste real no PostgreSQL 16 isolado. “HTTP” significa servidor Next real, sem banco operacional conectado. Não equivalem à homologação Supabase/Storage/Resend em HTTPS.

| Cenário                      | Evidência implementada/executada                                                                  | Limite pendente                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| A — sem sessão               | 12 testes HTTP: páginas redirecionam; APIs, arquivos e relatórios negam                           | Repetir com Supabase configurado e dados reais de homologação                      |
| B — dispositivos             | SQL: bootstrap uso único, revogação nega sessão existente                                         | Fluxo navegador OTP/HTTPS, e-mail e cookies Secure                                 |
| C — PIN e tentativas         | Unitário Argon2id correto/incorreto; SQL bloqueia sexta tentativa                                 | Login integrado pelo navegador e rate limit no perímetro                           |
| D — confirmação              | SQL: auditoria contém ator e diferenças; UI exige seleção/PIN                                     | Fluxo visual autenticado ponta a ponta                                             |
| E — adulteração              | Zod rejeita actor_id; hash muda com conteúdo; SQL rejeita confirmação expirada/adulterada/ausente | HTTP autenticado com confirmação legítima adulterada                               |
| F — serializada              | SQL instalação/remoção, local único e retorno pendente                                            | Anexos e aeronave na ficha agregada                                                |
| G — reserva                  | SQL mantém quantidade física e reduz disponível                                                   | Consumo parcial de reserva não implementado                                        |
| H — ferramenta concorrente   | Duas sessões PostgreSQL: uma retirada aberta                                                      | Repetir via dois dispositivos em homologação                                       |
| I — saldo/retry              | Corrida de duas saídas, saldo não negativo e retry concorrente aplica uma vez                     | Teste de carga sustentada                                                          |
| J — calibração/perdida       | SQL bloqueia sem calibração válida; ocorrência permanece separada do alerta                       | Documento certificado obrigatório e fluxo real completo                            |
| K — kit faltante             | SQL retorno sem item cria ocorrência persistente                                                  | Conferência visual pelo celular                                                    |
| L — material externo         | SQL despacho e retorno parcial, lote recebido pendente                                            | Documentos reais e vínculo de verificação antes de encerramento                    |
| M — tarefa na OS             | SQL preserva id e auditoria na associação posterior                                               | Ficha consolidada de recursos                                                      |
| N — conclusão administrativa | Código usa estado explícito; SQL nega OS com tarefa aberta; UI explica limite                     | Revisão de linguagem com organização                                               |
| O — documento privado        | HTTP anônimo negado; bucket privado e versionamento em migrations/API                             | Upload, versão anterior, RLS Storage e download com projeto Supabase real          |
| P — importação               | Unitários CSV/XLSX, fórmulas/limites, validação; prévia e mapeamento implementados                | Prévia de conflitos existentes, diff de atualização e erro de FK antes de executar |
| Q — alertas/e-mail           | SQL alertas/outbox deduplicados; worker com lease/backoff                                         | Envio, falha real e recuperação com Resend                                         |
| R — configurações            | Mesma sessão, mesmo comando/confirmador que operações                                             | Fluxo navegador autenticado                                                        |
| S — painel/relatórios        | Consultas reais, sem métricas fixas; filtros e paginação implementados                            | Validação de dados completos em Supabase e filtros cruzados avançados              |
| T — tema/mobile              | Testes Playwright de viewport e persistência escritos                                             | Não executados: navegador indisponível                                             |
| U — correções                | SQL rollback, histórico preservado, ajustes por evento; auditoria não reescrevível                | Mais casos de inventário e correção compensatória ponta a ponta                    |
| V — acesso direto            | SQL confirma RLS/grants e EXECUTE negado às roles públicas; HTTP anônimo negado                   | Gateway Supabase e Storage com tokens reais de homologação                         |

Fontes: `tests/security.test.ts`, `tests/e2e/*.spec.ts`, `supabase/tests/domain.sql` e `scripts/test-db.sh`. O runner de banco também testa dump/restore em banco descartável. Dados fictícios só são criados nesses testes; migrations de produção contêm apenas os nomes iniciais dos responsáveis.
