# Checklist de segurança — estado de 25/10/2026

Evidências: [CAMERA_OCR_REPORT](docs/CAMERA_OCR_REPORT.md), [camera-verification.json](docs/camera-verification.json) e [política de acesso](docs/ACCESS_POLICY.md). Não representa certificação de segurança.

- [x] Autorização expressa de publicação e de backup local/atualização do banco.
- [x] Backup real cifrado, chave separada, ambos fora do Git/deploy.
- [x] Restauração PostgreSQL 17 sem rede/portas e aplicação de 009 na cópia; preservação dos valores originais das 42 tabelas. Zero objetos privados na origem naquele instante.
- [x] Migration 009 aplicada no projeto existente; oito anteriores preservadas e comparação remota de valores aprovada.
- [x] RLS nas 42 tabelas, permissões de schema/tabelas/RPC e buckets privados rechecados.
- [x] Sessões/cookies, Argon2id, revogação, limites persistentes e confirmação auditada de operações preservados.
- [x] CSRF, payloads, idempotência, versões, concorrência e negação de acessos cobertos pela regressão isolada.
- [x] Upload com hash/MIME/tamanho, quarentena, proxy privado e visualização somente depois de clean.
- [x] Scanner real com assinaturas atuais, limites e falha fechada; foto local de ensaio liberada e EICAR bloqueado.
- [x] Worker local ativo e status sanitizado; depende do computador ligado e da sessão deste usuário.
- [x] QR/código de barras e OCR no navegador, sem enviar fotos a terceiros; PN/serial exigem revisão.
- [x] Transição de atualização impede iniciar a próxima operação com a ficha antiga; teste com resposta RSC retida.
- [x] 97 testes unitários, 207 integrados no CI final, baseline local de 204 e 30 cenários focados finais, build, TypeScript, lint e formatação aprovados.
- [x] Verificação de dependências sem vulnerabilidades conhecidas e busca de padrões de credenciais no código.
- [x] Verificação HTTPS de login dos dois mecânicos, cookies, dashboard, menu, logout, upload disponível e QR/OCR sintético, sem fixtures no banco real.
- [ ] Validar câmera, foco, iluminação, leitura e download nos celulares físicos da equipe.
- [ ] Garantir infraestrutura independente deste computador, com disponibilidade 24 horas, se a rotina exigir.
- [ ] Configurar backup externo automático, retenção e custódia; comprovar RPO 24h/RTO 4h com um acervo real de documentos.
- [ ] Configurar proteção de borda, monitoramento, incidentes e retenção dos eventos de acesso negado.
- [ ] Validar serviços de e-mail/alertas externos; permanecem desativados.
- [ ] Regularizar plano de hospedagem para uso comercial conforme política da Vercel. Nenhum upgrade foi contratado.
- [ ] Obter aceite dos procedimentos técnicos, certificados, privacidade e módulos parciais descritos em KNOWN_LIMITATIONS.

A senha compartilhada e os nomes declarados foram mantidos por determinação do proprietário. Não dão atribuição individual forte nem segundo fator. O ambiente online separado de testes foi cancelado pelo proprietário; CI e testes locais continuam isolados do backend real.
