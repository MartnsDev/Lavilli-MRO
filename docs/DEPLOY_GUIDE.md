> Atualização posterior: o proprietário determinou acesso somente por nome e senha, sem códigos. Veja [a política atual](ACCESS_POLICY.md). As referências anteriores a fatores independentes abaixo são históricas; não representam o fluxo atual.

# Preparação do deploy Vercel

Sem publicação autorizada. Repositório exclusivo: MartnsDev/Lavilli-MRO. Nunca enviar esta aplicação a outro repositório. Publicar primeiro uma branch de revisão; não atualizar main automaticamente, pois uma integração existente pode disparar produção.

## Ambientes

| Ambiente    | Backend                          | Acesso                                                                                    |
| ----------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| Development | Supabase local                   | APP_MODE=demo/test somente loopback                                                       |
| Preview     | Projeto isolado a ser autorizado | Proteção de deployment Vercel obrigatória; PREVIEW_PROTECTED=true somente após configurar |
| Production  | Projeto Supabase existente       | Somente após aprovação explícita e testes de homologação                                  |

Conta pessoal e uma equipe Vercel consultadas em leitura com sucesso; duas páginas de projetos não retornaram nome Lavilli nem vínculo com Lavilli-MRO. Não criar implantação apontando Preview ao backend real. APP_MODE=demo/test bloqueia URL remota de banco por construção; para uma futura homologação remota, provisionar e revisar um modo/configuração próprios antes de alterar essa proteção.

## Configuração a realizar pelo proprietário

Framework Next.js, Node 20+, build `npm run build`, instalar com `npm ci --legacy-peer-deps`. Região sugerida iad1 para banco existente us-east-1. Conferir região do backend isolado antes do Preview. Não adicionar cron até testar provedor, lease e cron secret. `vercel.json` já desativa todos os auto deploys Git (`git.deploymentEnabled=false`) e define iad1/build; manter o bloqueio também na integração. não confiar apenas em branch naming.

Variáveis exclusivas por ambiente em `.env.example`: APP_URL exata HTTPS, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PIN_HASH portável, SESSION_SECRET >=32 caracteres aleatórios, CRON_SECRET independente, EMAIL_MODE; RESEND_API_KEY/EMAIL_FROM apenas se configurados. Não usar NEXT_PUBLIC_ para segredo. PREVIEW_PROTECTED não ativa proteção Vercel: é confirmação operacional e o servidor recusa preview sem ela. Configurar proteção real no painel.

1. Dry-run já executado em 24/10/2026: somente 202610240009_security_boundary.sql pendente, nenhuma aplicada. Antes da promoção, revisar novamente diff/migration 009, comparar oito migrations existentes e executar `supabase db push --dry-run --linked` em estação autorizada. Dry-run não autoriza aplicação.
2. Fazer backup criptografado e verificar restauração em ambiente isolado, com Storage.
3. Aprovar migration remota e janela. Aplicar antes do código dependente; não fazer reset/seed/delete em produção.
4. Aparelhos legados precisam de nova autorização independente; registros são preservados e deixam de conceder acesso por padrão. Gerar códigos de aparelho com `npm run security:grant`; entregar arquivo privado por canal administrativo. Códigos expiram em 15 minutos. Para administração: `npm run security:grant -- --admin`.
5. Criar Preview protegido com backend isolado; executar SMOKE_TESTS.md e verificar cookies __Host-/Secure, CSP, proxy, scanner e revogação em HTTPS real.
6. Registrar URL, commit, região e resultados. Somente depois solicitar autorização explícita para promover produção.

Vercel não executa o scanner ClamAV instalado no sistema nem deve guardar chaves de backup em filesystem efêmero; executar scanner/backup em worker confiável separado. Não ativar cobrança ou upgrade automaticamente.

Referência de configuração: [Vercel Git Configuration](https://vercel.com/docs/project-configuration/git-configuration).

## Rotação de credenciais

Antes de alterar PIN_HASH/SESSION_SECRET, elevar administração e revogar todas as sessões persistidas em Segurança. Promover a configuração de forma atômica, retirar acesso a deployments antigos e verificar rejeição dos cookies antigos. A versão da credencial é comparada com o runtime; alterar variáveis em uma única instância não substitui revogação persistente e atualização de todos os runtimes. Revogar dispositivos e emitir novos códigos quando houver suspeita de comprometimento. Não registrar hashes, PIN ou segredos em relatórios.
