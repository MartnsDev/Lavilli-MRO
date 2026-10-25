# Deploy Vercel

Publicação autorizada pelo proprietário e concluída em 24/10/2026 (America/Sao_Paulo). URL: **https://lavilli-control.vercel.app**. Evidências e limites em [DEPLOYMENT_REPORT.md](DEPLOYMENT_REPORT.md).

## Projeto e versão

- Repositório exclusivo: `MartnsDev/Lavilli-MRO`.
- Projeto Vercel: `lavilli-control`, equipe `matheus-s-projects-3ebcc424`.
- Código publicado: `a3fcb179b05f07231d173f9bddf55a8ebcfd3ae4`.
- Node `22.x`, Next.js, região `iad1`.
- Instalação: `npm ci --legacy-peer-deps`; build: `npm run build`.
- Publicação manual via CLI; auto deploy Git continua desativado em `vercel.json`. Preview desativado e sem credenciais de produção.
- Plano existente Hobby, sem upgrade ou cobrança ativada. Uso comercial exige Pro/Enterprise segundo as [regras da Vercel](https://vercel.com/docs/limits/fair-use-guidelines); regularizar o plano antes do uso empresarial.

## Variáveis de produção

Configuradas criptografadas na Vercel: `APP_URL`, `APP_MODE`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PIN_HASH`, `SESSION_SECRET`, `CRON_SECRET`, `EMAIL_MODE`, `PREVIEW_PROTECTED`. Nenhum valor secreto consta deste relatório ou do Git. `APP_URL` corresponde exatamente ao domínio acima; modo normal, e-mail desativado. Segredos de sessão e cron independentes. Não usar prefixo `NEXT_PUBLIC_` para segredos.

O login é nome (César/Maranhão) e senha geral configurada pelo proprietário. Sem códigos temporários, autorização manual de aparelho ou conta Vercel no domínio principal. Consulte [ACCESS_POLICY.md](ACCESS_POLICY.md).

## Banco e recursos pendentes

O mesmo Supabase existente é usado. Não houve aplicação de migration, reset, seed, exportação de backup real ou alteração de registros operacionais. Login/logout registram sessões e eventos normais de acesso. As oito migrations remotas existentes foram preservadas. A migration 009 continua pendente; a versão publicada possui compatibilidade explícita com o schema anterior para acesso e operações básicas. Não presumir que todos os recursos da migration 009 estão disponíveis remotamente.

Importações endurecidas, scanner/quarentena e jobs com lease exigem conclusão da infraestrutura/migration; scanner, e-mail e cron não foram ativados. Antes de qualquer migration remota: revisar diff, autorizar backup privado e validar restauração isolada banco+Storage, depois aprovar a aplicação. Não executar testes destrutivos no backend real.

Vercel não substitui worker ClamAV nem backup externo. RPO 24h/RTO 4h são metas propostas, sem SLA comprovado. Veja [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).

## Publicar uma atualização

1. Trabalhar apenas no repositório autorizado e verificar o diff; nunca enviar `.env*`, `.local-secrets`, backups ou chaves.
2. Executar verificações locais, inclusive `npm run test:full` com Supabase isolado. Confirmar compatibilidade com as migrations realmente aplicadas.
3. Verificar `.vercel/project.json` local apontando ao projeto/equipe acima. Não versionar esse arquivo.
4. Com publicação autorizada, executar `VERCEL_TELEMETRY_DISABLED=1 npx --yes vercel@65.2.0 deploy --prod --yes --scope matheus-s-projects-3ebcc424`.
5. Verificar estado READY e alias principal. Testar nome+senha no domínio principal, dashboard, saúde autenticada, cookies, navegação e logout; não inserir fixtures reais.
6. Registrar commit, deployment e resultados. Não promover automaticamente um deployment incompatível nem alterar cobrança.

## Rotação e recuperação

Alterar senha pelo processo privado de configuração; não salvar PIN em documentação. Atualizar hash e segredos de forma coordenada, revogar sessões conforme [ACCESS_POLICY.md](ACCESS_POLICY.md) e verificar rejeição de sessões antigas. Nunca reativar uma implantação com credenciais antigas como atalho de rollback. Veja [ROLLBACK.md](ROLLBACK.md).
