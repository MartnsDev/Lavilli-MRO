# Limitações conhecidas

- Código publicado na Vercel com compatibilidade para as oito migrations existentes; migration 009 continua pendente. Fluxos básicos de acesso/navegação foram verificados em HTTPS; funcionalidades dependentes de 009 não estão homologadas no backend remoto. Veja DEPLOYMENT_REPORT.md.
- Preview Vercel permanece desativado e sem backend remoto isolado. Projeto de produção lavilli-control criado e publicado com autorização. Plano atual Hobby; regularizar plano para uso comercial conforme regras da Vercel, sem upgrade automático.
- Upload/download online indisponíveis enquanto faltam as funções de segurança da migration 009. A interface e as APIs agora informam esse estado explicitamente; PN, serial e vínculo foram testados no ambiente isolado. Veja PART_DOCUMENT_VERIFICATION.md.
- Scanner operacional não configurado; assinaturas locais com 27 dias são recusadas; uploads permanecem pending e downloads são bloqueados. Teste de parecer clean simulado não equivale a antivírus.
- E-mail real/provedor/domínio/agendamento e entrega não comprovados; demonstração mantém EMAIL_MODE=disabled.
- Backup externo, retenção, chaves de recuperação e restauração integral banco+Storage ainda pendentes; metas RPO 24h/RTO 4h não são SLA comprovado.
- PIN de quatro dígitos compartilhado e nomes declarados não dão atribuição individual forte. Conforme decisão expressa do proprietário, não há autorização independente por código. Não equivale a assinatura técnica.
- Limites de aplicação dependem do banco; proteção de borda/alertas externos e limites de custo precisam de configuração operacional.
- Eventos de acessos negados podem crescer sob ataque; definir retenção/monitoramento sem apagar trilha operacional indiscriminadamente.
- CSP ainda permite style inline por compatibilidade de componentes; scripts recebem nonce e não permitem unsafe-eval em produção.
- Mobile/Firefox em automação não substituem câmera, leitor QR, download e teclado em cada aparelho real.
- Refresh a cada minuto em aba visível; não há sincronização Realtime instantânea/offline.
- Ambiente de testes contém TEST-_; a demo tem banco local próprio com DEMO-_. Nunca reutilizar nenhum deles como banco real nem projetar credenciais privadas.
- Requisitos legais, retenção, responsáveis e política de privacidade precisam de validação da Lavilli; não foi declarada certificação.

- Importações aceitam originais de até 2 MiB; a confirmação JSON tem limite de 64 KiB. Dividir lotes grandes quando o payload de confirmação exceder esse limite; a API rejeita com 413 antes de gravar.

Recursos de produto ainda parciais: conversão de unidades/requisitos de armazenamento, recebimento multi-item único, certificado privado obrigatório na calibração, remoção da composição histórica de kits, tela dedicada de planejamento por tarefa/OS, diff/atualização por importação, busca relacional especializada, relatórios assíncronos/filtros cruzados e regras de alerta por múltiplas janelas/reabertura. Esses itens não são necessários aos cenários locais A–F apresentados, mas não foram declarados finalizados. A calibração aceita referência textual; conferência técnica do certificado continua obrigatória no processo da equipe.
