# Limitações e conformidade

Este é um sistema de apoio operacional interno. Não certifica aeronavegabilidade, não substitui formulários oficiais, manuais/procedimentos aprovados, assinatura de profissional habilitado ou autorização para retorno ao serviço. Não há declaração automática de conformidade ANAC/RBAC 43/RBAC 145. A organização e seu responsável técnico devem validar campos, processos, intervalos e retenção aplicáveis.

O responsável escolhido é informado/autodeclarado. PIN compartilhado não permitem comprovar autoria individual. Auditoria registra esse limite; não é assinatura técnica autenticada. A conclusão de tarefa/OS é administrativa e não altera status técnico de voo da aeronave.

## Dependências de implantação

O arquivo privado de desenvolvimento preserva a configuração do projeto real; a migration 009 ainda não foi aplicada remotamente. A demonstração possui Supabase local próprio e não usa dados reais. Acesso diário por nome/PIN depende de autorização independente prévia do aparelho. Remetente/Resend, scanner atualizado, backups externos, agendador e deploy dependem de configuração final.

A verificação funcional agora inclui Supabase local com API/Storage reais e Chrome automatizado em computador e celular. Migrações, concorrência e dump/restore foram exercitados em PostgreSQL 16 e 17. Consulte `RELEASE_READINESS.md` e `verification-results.json` para as evidências e o alcance. Câmera em aparelho físico, entrega externa de e-mail, restauração integral em outro projeto e desempenho sob carga de produção continuam exigindo homologação específica.

## Recursos parciais

- Formulários genéricos cobrem cadastros e fichas; relacionamentos recentes são agregados, com limite de 25 registros por grupo e 100 documentos vinculados.
- Movimentos de materiais e retiradas de ferramentas permitem vínculos a tarefas/OS/aeronaves; planejamento dedicado de materiais ainda está parcial. Sem conversões de unidades e cadastro completo de requisitos de armazenamento.
- Importação cria/ignora duplicados; não há diff de atualização selecionada ; o original agora é armazenado privadamente e vinculado ao histórico. Erros de FK/duplicidade são confirmados na execução e registrados por linha; não existe prévia completa de conflitos existentes.
- Pesquisa é textual por campos diretos; número de OS e relações indiretas não têm pesquisa especializada.
- Relatórios têm filtros de criação/situação e limite 1.000/página; PDF resume colunas e trunca textos extensos. Não há filtros completos por todos os vínculos nem processamento assíncrono.
- Calibração registra referência do certificado; ainda não exige documento privado vinculado. Regras de estoque/custódia não devem ser interpretadas como aprovação técnica.
- Alertas usam antecedência global derivada das regras, não todas as combinações por tipo/janela. Alertas não resolvem automaticamente quando origem é corrigida; resolução manual não muda ocorrência. IDs de evento deduplicam alertas; uma ocorrência resolvida e recorrente pode exigir novo evento/melhoria de reabertura.
- Rotina de e-mail possui lease, backoff e deduplicação; confirmação de entrega pelo destinatário e webhooks de bounce não estão implementados. Não há promessa exactly-once de entrega externa.
- Arquivos são validados por tamanho/MIME/extensão/assinatura; há integração com worker ClamAV, mas scanner operacional atualizado ainda não foi homologado; arquivos pendentes permanecem bloqueados. Falha de processo entre upload e transação pode deixar objeto órfão, sujeito a reconciliação de infraestrutura.
- Manifest/ícones PNG e SVG existem; instalação PWA multiplataforma ainda precisa de verificação. Câmera QR usa BarcodeDetector quando suportado e tem alternativa manual, sem homologação em aparelho real. Não há alterações offline.
- Retenção é declarativa e depende de validação; nenhum expurgo automático de dados pessoais/auditoria foi ativado.
- Restauração integral de Storage e disponibilidade/performance com carga real ainda precisam ser testadas. Referências em selects mostram até 200 cadastros recentes; links em fichas mostram nomes quando disponíveis, mas fluxos com bases grandes exigem busca remota nos selects.

Antes de produção, execute homologação dos fluxos autorizados e das negações, valide backup/restore, configure observabilidade e obtenha aceite das limitações. Manuais de terceiros só devem ser armazenados com direitos de uso; referências para portais oficiais são suportadas.
