# Verificação funcional profissional

A suíte automatizada usa um Supabase local isolado, com PostgreSQL 17, PostgREST e Storage reais. A aplicação roda como build de produção na porta 3100, com senha aleatória e segredos temporários. A senha e os dados reais do hangar não são usados nos testes de escrita.

## Resultado em 24/10/2026

- **131/131 testes integrados aprovados:** 65 de API e 33 de interface em cada perfil (computador e Android emulado).
- **39/39 testes unitários aprovados.**
- **16/16 testes de login e negação anônima aprovados** no servidor local existente.
- Regras SQL, permissões, rollback, três corridas concorrentes e dump/restore aprovados em **PostgreSQL 16 e 17**.
- Build de produção, lint, TypeScript, formatação e verificação de padrões de segredos aprovados.
- `npm audit`: **zero vulnerabilidades conhecidas** nas dependências instaladas na data da execução.
- A migração 008 foi aplicada ao projeto Supabase `ecyzjuhryfqqpqoskyth`. Dados de teste foram gravados somente no ambiente isolado.

Relatório completo desta rodada: `playwright-report/full/index.html`. A aprovação demonstra os cenários abaixo e os limites explicitados ao final.

## Cobertura

| Área                    | Verificação                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Acesso                  | César e Maranhão, mesma senha, senha incorreta, saída, sessão inválida, origem externa                                   |
| Navegação               | Todos os menus, módulos secundários, formulários e fichas em computador e celular; erros de JavaScript e overflow        |
| Cadastros               | Criação pelo navegador, leitura persistida e histórico; edição, revisão, arquivamento e conflito de versão               |
| Estoque                 | Recebimento, conferência, reserva, liberação, consumo reservado, consumo, descarte e transferência; validação dos saldos |
| Inventário              | Contagem, conciliação, saldo modificado após contagem e bloqueio de encerramento com pendências                          |
| Peças serializadas      | Condição/documentação, transferência, instalação, remoção, localização desconhecida e versões obsoletas                  |
| Ferramentas             | Retirada única, devolução, ocorrências, condição, calibração e indisponibilidade                                         |
| Kits                    | Conferência completa de saída, retorno incompleto e abertura de ocorrência; rollback da retirada incompleta              |
| Aeronaves, tarefas e OS | Matrícula e auditoria; comentários, estados, reabertura e bloqueio de fechamento com tarefa aberta                       |
| Materiais externos      | Itens, despacho, rastreamento, custódia, retorno parcial, excesso de retorno e encerramento                              |
| Documentos              | Upload real, versões, hash, recusa de arquivo inválido, download assinado e bloqueio de acesso público                   |
| Importações             | CSV/XLSX, modelos, mapeamento/prévia no navegador, execução, duplicidades e histórico por linha                          |
| Relatórios              | CSV e PDF válidos das 12 categorias; filtros inválidos e download pela interface                                         |
| QR                      | Etiquetas com imagem QR e texto escapado; abertura por URL/código manual                                                 |
| Alertas                 | Geração deduplicada, reconhecimento e resolução; worker e transporte de e-mail com provedor simulado                     |
| Integridade             | Confirmação adulterada/vencida/de outra sessão; retry idempotente; corridas simultâneas; RLS/grants e auditoria imutável |
| Continuidade            | Dump/restore de banco descartável em PostgreSQL 16 e 17                                                                  |

As 34 coleções possuem teste autenticado de listagem e opções. Os responsáveis são fixos em César e Maranhão: a aplicação não oferece criar, renomear ou desativar essas identidades pelo cadastro operacional.

## Correções feitas nesta revisão

- Consulta de opções de auditoria não tenta filtrar uma coluna inexistente.
- A revisão de formulário mantém os valores e a justificativa já digitados.
- Controles de formulário possuem associação explícita entre rótulo e campo.
- Janelas de formulário no celular usam posicionamento estável, limite de altura e campos de 16 px para evitar zoom durante o preenchimento.
- Repetição de upload já confirmado retorna sucesso sem duplicar versão/objeto.
- Seletores de arquivo aguardam o processamento estar disponível; o hash acompanha a seleção atual e o mesmo arquivo pode ser escolhido novamente após salvar.
- O botão de saída mantém nome acessível mesmo quando aparece só como ícone no celular.
- Operações sem registro alvo falham, sem registrar um sucesso ou auditoria órfã (migração 008).
- Paginação preserva o filtro de situação e normaliza número de página.
- Requisições JSON inválidas retornam erro de dados (400).
- Cadastro operacional não permite alterar as duas identidades do login.

## Executar e consultar evidências

Consulte os comandos no README. `npm run test:full` reconstrói a aplicação em diretório separado e gera relatório HTML e traces/capturas de falhas. `npm run test:db:docker` cria e remove somente bancos com prefixo `lavilli_test_` dentro do container local. O workflow `.github/workflows/checks.yml` executa os testes em cada push para main e pull request.

## Limites da conclusão

Testes aprovados demonstram os cenários descritos, não ausência absoluta de defeitos. Não foram homologados entrega real por Resend, câmera em aparelho físico, instalação PWA em todos os sistemas, comportamento de todos os provedores HTTPS, restauração de Storage em outro projeto nem desempenho com carga real. O teste mobile usa viewport e interação em Chrome; não substitui homologação em Safari/iOS. A entrega externa de e-mail é simulada nos testes unitários e nenhum e-mail foi enviado.

As limitações de produto já documentadas (planejamento dedicado de materiais, filtros avançados, referências com limite de 200 opções, certificado de calibração vinculado e outras) continuam em `limitations-and-compliance.md`. Não há declaração automática de certificação aeronáutica ou de prontidão irrestrita para produção.
