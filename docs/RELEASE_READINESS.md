# Prontidão para apresentação e deploy

24/10/2026. **PRONTO PARA DEMONSTRAÇÃO**, exclusivamente local e com as limitações declaradas. **Produção: NÃO PRONTO.** Não houve deploy ou alteração do banco remoto.

| Módulo                                    | Estado          | Evidência / limite                                                                                                                  |
| ----------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Acesso por mecânico e dispositivo         | FUNCIONAL local | API, SQL, sessão/revogação e códigos; migration remota pendente                                                                     |
| Dashboard, busca, navegação, localizações | FUNCIONAL local | Rotas e formulários automatizados                                                                                                   |
| Catálogo, lotes, saldo e reservas         | FUNCIONAL local | Transações e saldos negativos/concorrência testados                                                                                 |
| Ferramentas, kits e calibração            | PARCIAL         | Retirada/devolução/liberação testadas; vínculo obrigatório do certificado e remoção histórica de kit ainda parciais                 |
| Aeronaves, tarefas, OS e comentários      | FUNCIONAL local | Operações e histórico automatizados; conclusão administrativa                                                                       |
| Remessas externas e retorno               | FUNCIONAL local | Envio parcial, retorno e local de recebimento                                                                                       |
| Inventário físico e divergências          | FUNCIONAL local | Ajustes com confirmação e histórico                                                                                                 |
| Importação CSV/XLSX e QR                  | FUNCIONAL local | Validação/mapeamento/original privado; scanner de câmera exige aparelho/permissão reais                                             |
| Documentos privados                       | PARCIAL         | Upload, versões, proxy e bloqueio testados; scanner operacional ainda não configurado (assinaturas locais com 27 dias; fail-closed) |
| Relatórios/exportação                     | FUNCIONAL local | Elevação, CSV seguro e auditoria; sessão administrativa expira                                                                      |
| Alertas internos e auditoria              | FUNCIONAL local | Registro e consulta reais locais                                                                                                    |
| E-mail e jobs agendados na nuvem          | BLOQUEADO       | Sem provedor/domínio/agendamento validados; sem envio real                                                                          |
| Backup e recuperação integral             | PARCIAL         | Criptografia e dump/restore SQL; offsite e Storage integral pendentes                                                               |
| Demo na nuvem / Vercel Preview            | BLOQUEADO       | Conta acessível, consulta não encontrou projeto Lavilli; falta backend isolado autorizado                                           |
| Produção                                  | BLOQUEADO       | Migration, backup, scanner, observabilidade e autorização de publicação                                                             |

| Planejamento dedicado de materiais/conversões | AUSENTE | Vínculos nos eventos existem; não há tela dedicada nem conversão automática |
| Atualização por importação e filtros avançados | PARCIAL | Criação/ignorar duplicados e filtros básicos funcionam; sem diff/atualização ou processamento assíncrono |

## Evidências

- 176/176 casos integrados aprovados em rodada completa: Chrome, Firefox, mobile, APIs reais e Storage local.
- Regressão complementar no código final: 3/3 casos aprovados (teclado/reflow, logout após inatividade com relógio acelerado, matriz visual completa), seguidos de 3/3 casos de estados pendente/liberado e download de documentos em Firefox/Chrome/mobile. Total: 177 casos distintos; cinco casos foram repetidos nas regressões.
- 43/43 unitários; PostgreSQL 16 e 17: migrations, 42 tabelas × dois papéis × cinco operações negadas, rollback, três disputas concorrentes e dump/restore.
- Matriz: 1.104 medições, 46 rotas × dois temas × 12 larguras, sem overflow da página ou erros JavaScript. Capturas antes/depois e registro de console/rede; tabelas mantêm scroll local.
- Demo dedicada: login real por interface, desktop/mobile, alertas próprios e nenhum TEST-*; PDF permanece pending até scanner operacional.
- Dry-run remoto confirmou apenas 009 pendente, sem aplicação; oito migrations remotas preservadas. Contas Vercel pessoal e uma equipe consultadas em leitura, sem projeto Lavilli/repositório correspondente.

Detalhamento reproduzível: [verification-results.json](verification-results.json). O último ajuste de inatividade alterou apenas Shell; a matriz de todas as rotas e teclado foi repetida no build final. Não se declara certificação WCAG, homologação em aparelho físico ou segurança de produção.

## Gate de entrega

Demo local: abrir `npm run demo:local` após build de verificação; dados com prefixo DEMO e banner permanente, e-mail desativado, Supabase limitado a loopback. O banco da demo usa outro project_id e outras portas, separado do banco de testes; não contém fixtures TEST-* da suíte. Não reutilizar o banco local como produção.

Produção depende dos itens não marcados de SECURITY_CHECKLIST.md. Nenhum serviço pago foi contratado, projeto Supabase criado ou registro remoto de demonstração inserido.

## Funcionalidades ainda parciais no escopo amplo

Conversão de unidades/recebimento multi-item único, vínculo privado obrigatório na calibração, remoção histórica de composição de kit, tela dedicada de planejamento de materiais, atualização com diff por importação, filtros/relatórios assíncronos e regras avançadas de alerta não estão finalizados. Operações básicas desses módulos estão testadas; ver KNOWN_LIMITATIONS.md e implementation-plan.md. Não confundir prontidão para os cenários de apresentação com conclusão integral de todos os recursos do produto.
