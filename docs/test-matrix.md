# Matriz atual de testes

A cobertura ativa está detalhada em [Verificação funcional profissional](professional-verification.md). O fluxo de acesso é somente César ou Maranhão e a senha geral já configurada.

| Camada                   | Comando                                                  | Ambiente                                                              |
| ------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Unidade                  | `npm test`                                               | Memória, arquivos temporários e provedores simulados                  |
| API e login sem sessão   | `npm run test:e2e` / `npm run test:ui`                   | Servidor local existente; sem escrita operacional                     |
| Operações e UI completas | `npm run test:full`                                      | Build separada + Supabase local real + Chrome desktop/Android emulado |
| Migrações e integridade  | `npm run test:db:docker`                                 | PostgreSQL 17 do container local; bancos descartáveis                 |
| Compatibilidade do banco | `RUN_DATABASE_TESTS=1 ... npm run test:db`               | PostgreSQL 16 isolado                                                 |
| Qualidade e dependências | lint, TypeScript, formatação, build, secrets e npm audit | Código e versões instaladas                                           |

Não confundir envio simulado de e-mail com entrega externa, emulação mobile com câmera física, ou dump/restore descartável com recuperação completa de produção. Esses limites estão explícitos no relatório de verificação.
