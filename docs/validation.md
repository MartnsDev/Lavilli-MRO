# Validação executada

Execução em 23/10/2026, fuso America/Sao_Paulo. Nenhuma credencial real foi fornecida, nenhum dado de produção foi utilizado e nenhum e-mail foi enviado.

| Verificação                                       | Resultado                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                    | Passou, sem erros ou avisos                                                                                                         |
| `npm run typecheck`                               | Passou, TypeScript estrito                                                                                                          |
| `npm test`                                        | 14 testes passaram                                                                                                                  |
| `npm run format:check`                            | Passou                                                                                                                              |
| `npm run check:secrets`                           | Passou para os padrões reconhecidos; não substitui revisão manual                                                                   |
| `npm run build`                                   | Passou, Next 16.4.3, incluindo `/scan` e rotas operacionais                                                                         |
| `npm run test:db`                                 | Passou: seis migrations, regras de domínio, auditoria, negações, confirmação, revogação, rate limit, outbox e vínculos de materiais |
| Concorrência PostgreSQL real                      | Três corridas passaram: ferramenta, saída de estoque e repetição idempotente                                                        |
| Dump/restore PostgreSQL                           | Passou em banco descartável; dados e negação da RPC anônima preservados                                                             |
| `npm run test:e2e`                                | 12 testes HTTP passaram tanto no servidor de desenvolvimento quanto na build de produção                                            |
| Auditoria npm na instalação final de dependências | Zero vulnerabilidades reportadas                                                                                                    |
| Ícones PWA                                        | PNGs verificados: 192×192 e 512×512                                                                                                 |

O teste final HTTP foi executado com `TEST_BASE_URL=http://127.0.0.1:3001 npm run test:e2e` contra `next start`. O banco isolado PostgreSQL 16 usou porta 55439; o runner cria e remove somente bancos `lavilli_test_*`. Não foram usados mocks de Supabase para declarar integração real.

Não executado: testes visuais Chromium/mobile, fluxo autenticado no navegador, Supabase gateway/Storage reais, envio Resend, agendador externo, restauração de arquivos reais e deploy HTTPS. O runtime de navegador informou nenhum navegador disponível. O Docker local não estava acessível. Essas verificações continuam pendentes na matriz de aceitação.
