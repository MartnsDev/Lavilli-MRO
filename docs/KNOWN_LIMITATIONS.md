# Limitações conhecidas

- Código de câmera/OCR publicado na Vercel e migration 009 aplicada com autorização, backup e comparação de preservação nas 42 tabelas. Verificação remota de login/leitura/capacidade de upload e OCR local em HTTPS passou; escritas operacionais foram exercitadas somente no banco local isolado. Veja CAMERA_OCR_REPORT.md.
- Preview Vercel permanece desativado e sem backend remoto isolado. Projeto de produção lavilli-control criado e publicado com autorização. Plano atual Hobby; regularizar plano para uso comercial conforme regras da Vercel, sem upgrade automático.
- Upload privado está habilitado. PN, serial, criação/vínculo do documento, foto, quarentena e download foram testados no ambiente isolado; não foram inseridos documentos fictícios no banco real.
- Scanner ClamAV local está configurado e teve ensaio real com foto de teste e EICAR. Depende deste computador ligado e do serviço em execução; o serviço é iniciado automaticamente na sessão deste usuário. Sem worker, arquivos ficam pending e bloqueados. Não há scanner 24 horas contratado.
- E-mail real/provedor/domínio/agendamento e entrega não comprovados; demonstração mantém EMAIL_MODE=disabled.
- Backup real cifrado e restauração PostgreSQL 17 isolada foram comprovados antes de 009, com zero objetos privados presentes naquele instante. Cópia externa, retenção, rotina automática e recuperação de um acervo real de documentos continuam pendentes; metas RPO 24h/RTO 4h não são SLA.
- PIN de quatro dígitos compartilhado e nomes declarados não dão atribuição individual forte. Conforme decisão expressa do proprietário, não há autorização independente por código. Não equivale a assinatura técnica.
- Limites de aplicação dependem do banco; proteção de borda/alertas externos e limites de custo precisam de configuração operacional.
- Eventos de acessos negados podem crescer sob ataque; definir retenção/monitoramento sem apagar trilha operacional indiscriminadamente.
- CSP permite estilos inline por compatibilidade. Páginas usam nonce sem unsafe-eval; somente os recursos estáticos do worker OCR permitem wasm-unsafe-eval para inferência local, sem liberar JavaScript eval nas páginas.
- Mobile/Firefox em automação não substituem câmera, leitor QR, download e teclado em cada aparelho real.
- Refresh a cada minuto em aba visível; não há sincronização Realtime instantânea/offline.
- Ambiente de testes contém TEST-_; a demo tem banco local próprio com DEMO-_. Nunca reutilizar nenhum deles como banco real nem projetar credenciais privadas.
- Requisitos legais, retenção, responsáveis e política de privacidade precisam de validação da Lavilli; não foi declarada certificação.

- Importações aceitam originais de até 2 MiB; a confirmação JSON tem limite de 64 KiB. Dividir lotes grandes quando o payload de confirmação exceder esse limite; a API rejeita com 413 antes de gravar.

Recursos de produto ainda parciais: conversão de unidades/requisitos de armazenamento, recebimento multi-item único, certificado privado obrigatório na calibração, remoção da composição histórica de kits, tela dedicada de planejamento por tarefa/OS, diff/atualização por importação, busca relacional especializada, relatórios assíncronos/filtros cruzados e regras de alerta por múltiplas janelas/reabertura. Esses itens não são necessários aos cenários locais A–F apresentados, mas não foram declarados finalizados. A calibração aceita referência textual; conferência técnica do certificado continua obrigatória no processo da equipe.
