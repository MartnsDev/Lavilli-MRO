# Limitações conhecidas

- Produção não recebeu migration 009 nem novo código; não publicar app dependente antes da migration revisada/autorizada.
- Preview Vercel não provisionado: falta backend isolado autorizado e proteção/configuração do projeto. Consulta Vercel em leitura não encontrou projeto Lavilli.
- Scanner operacional não configurado; assinaturas locais com 27 dias são recusadas; uploads permanecem pending e downloads são bloqueados. Teste de parecer clean simulado não equivale a antivírus.
- E-mail real/provedor/domínio/agendamento e entrega não comprovados; demonstração mantém EMAIL_MODE=disabled.
- Backup externo, retenção, chaves de recuperação e restauração integral banco+Storage ainda pendentes; metas RPO 24h/RTO 4h não são SLA comprovado.
- PIN de quatro dígitos e nomes declarados não dão atribuição individual forte; a autorização independente reduz exposição, não transforma isso em assinatura.
- Limites de aplicação dependem do banco; proteção de borda/alertas externos e limites de custo precisam de configuração operacional.
- Eventos de acessos negados podem crescer sob ataque; definir retenção/monitoramento sem apagar trilha operacional indiscriminadamente.
- CSP ainda permite style inline por compatibilidade de componentes; scripts recebem nonce e não permitem unsafe-eval em produção.
- Mobile/Firefox em automação não substituem câmera, leitor QR, download e teclado em cada aparelho real.
- Refresh a cada minuto em aba visível; não há sincronização Realtime instantânea/offline.
- Ambiente de testes contém TEST-_; a demo tem banco local próprio com DEMO-_. Nunca reutilizar nenhum deles como banco real nem projetar credenciais privadas.
- Requisitos legais, retenção, responsáveis e política de privacidade precisam de validação da Lavilli; não foi declarada certificação.

- Importações aceitam originais de até 2 MiB; a confirmação JSON tem limite de 64 KiB. Dividir lotes grandes quando o payload de confirmação exceder esse limite; a API rejeita com 413 antes de gravar.

Recursos de produto ainda parciais: conversão de unidades/requisitos de armazenamento, recebimento multi-item único, certificado privado obrigatório na calibração, remoção da composição histórica de kits, tela dedicada de planejamento por tarefa/OS, diff/atualização por importação, busca relacional especializada, relatórios assíncronos/filtros cruzados e regras de alerta por múltiplas janelas/reabertura. Esses itens não são necessários aos cenários locais A–F apresentados, mas não foram declarados finalizados. A calibração aceita referência textual; conferência técnica do certificado continua obrigatória no processo da equipe.
