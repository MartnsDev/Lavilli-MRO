# Decisões de implementação

1. Projeto local Next.js + Supabase, compatível com Vercel. O pedido exige este repositório e não autoriza configurar domínio; nenhuma conta, serviço pago ou publicação foi criada.
2. Autenticação própria de dispositivo/sessão para atender PIN compartilhado, sem inventar usuários pessoais ou hierarquia de cargos. A infraestrutura deve ser protegida por MFA no provedor.
3. Service role apenas no servidor; acesso direto da Data API negado. Leitura de sessão é feita junto às consultas, pois layout isolado não é autorização suficiente em Next.
4. Transações PostgreSQL concentram comandos críticos, confirmação, idempotência e auditoria. Não há cadeia de atualizações HTTP para saldo. SQL dinâmico limita tabelas/colunas por whitelist, e valores usam parâmetros.
5. Interface de cadastros baseada em metadados tipados para manter consistência em muitos módulos. Regras críticas continuam em comandos específicos. Não se permite editar saldos pelo formulário genérico.
6. Atualização periódica de 60s em vez de canal público Realtime. Sem escrita offline. Manifest básico de instalação não implica sincronização offline.
7. Quantidades `numeric` no banco. Unidades não são convertidas automaticamente. Custos e regras completas de armazenamento estão parciais.
8. Arquivos de até 4 MB para caber no upload via backend e limite de payload do destino Vercel. Nova versão tem caminho novo; erro de transação tenta remover o objeto recém-enviado. É necessário reconciliar objetos órfãos após falha de processo entre Storage e PostgreSQL.
9. Importação limitada a 100 linhas/2 MB por transação. XLSX é conteúdo não confiável: fórmulas e hyperlinks são rejeitados; há limite de expansão ZIP. Atualizar registros por importação ainda não foi liberado.
10. Alertas periódicos e e-mail separados: a regra atual usa maior antecedência das regras ativas, e envio habilitado é global. Não afirmar suporte a todas as janelas individuais 30/15/7.
11. Next 16.4.3 e React 19.3.1 foram consultados/instalados pelo npm. TypeScript 6.0.3 é usado por compatibilidade do lint. O checker Next usa API TypeScript (`experimental.useTypeScriptCli=false`) porque a captura stdout da CLI falhou neste ambiente; `tsc --noEmit` continua obrigatório.
12. Override `exceljs > uuid ^11.1.1` corrige alerta transitivo, validado pelos testes de leitura/escrita de XLSX. `npm audit` terminou sem vulnerabilidades. Lockfile fixa as versões.
13. Datas visíveis usam America/Sao_Paulo. Formulários de prazo interpretam entrada no UTC-3 vigente em São Paulo; suporte a datas históricas durante horário de verão requer conversor de timezone antes desse uso.
14. O esquema derivado é gerado por introspecção PostgreSQL, sem exigir Docker para geração de tipos. Configuração Supabase local existe; testes SQL usam PostgreSQL puro, sem simular que Storage/Resend foram integrados.

15. Vínculos de consumo/reserva com tarefas/OS/aeronaves são colunas opcionais de stock_movements, a fonte do histórico físico. Não há duplicação do saldo em tabelas de materiais. As fichas agregam os registros relacionados mais recentes.
