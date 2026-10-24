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

16. O primeiro teste real do SDK revelou exigência de WebSocket nativo no Node 20. Foi adicionado transporte `ws` exclusivo do servidor e dos scripts de backup/restore, com teste de regressão de construção do cliente sem rede. Node 22 continua recomendado para CI/deploy.
17. O CLI Supabase 2.122.0 foi usado para vincular somente `ecyzjuhryfqqpqoskyth`, cujo PostgreSQL é 17. A configuração local foi ajustada de 16 para 17; testes de domínio anteriores em PostgreSQL 16 permanecem evidência de compatibilidade do SQL.

18. O acesso foi refeito com a paleta real do site (#051C2C, #125572, #E2B476), Montserrat local e logotipo original `logo-lavilli-1.png`, integrado ao cabeçalho. Fonte com licença OFL incluída. Chrome automatizado em perfil temporário permitiu testar desktop/mobile e revisar capturas, embora o conector Browser permanecesse sem sessão conectada.
19. O erro de entrada veio de PIN_HASH ausente. A primeira definição agora pode ocorrer no navegador somente em desenvolvimento local, com prova de recuperação forte e sem sobrescrever senha existente. Produção continua exigindo configuração pelo ambiente seguro.
20. Hashes Argon2 contêm `$`; os scripts e a inicialização local agora armazenam representação portável base64url, validada pelo carregador dotenv real do Next. A verificação central também aceita hash cru de provedores e atende tanto login quanto confirmação de mutations.
