# Configuração e deploy

## Preparar Supabase

Use projeto dedicado. Aplique cada arquivo de `supabase/migrations` em ordem no destino revisado, pelo SQL Editor/CLI com mecanismo de controle de migrations. Produção não usa reset nem migrations destrutivas automáticas. O arquivo Storage exige Supabase real; testes PostgreSQL usam apenas catálogo mínimo para conferir sua sintaxe.

Para Supabase local, Docker precisa estar disponível: `npx supabase start`. Este ambiente não possuía acesso ao daemon Docker; as regras de domínio foram testadas com PostgreSQL 16 isolado. Leia a saída local de configuração no terminal privado e nunca a grave no repositório.

## Segredos

Copie `.env.example` para `.env.local` (ignorado). Configure APP_URL, SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no servidor. Em produção APP_URL deve ser o endereço HTTPS exato. Nenhuma variável operacional usa NEXT_PUBLIC_.

Defina PIN_HASH sem inserir a senha em argumentos, arquivo ou histórico:

```bash
# bash; entrada não aparece no terminal
read -rs -p 'Senha geral: ' LAVILLI_PIN
printf '%s' "$LAVILLI_PIN" | npm run pin:hash --silent
unset LAVILLI_PIN
```

Guarde o hash produzido diretamente no cofre/ambiente de infraestrutura. Use um gerenciador de senhas para gerar SESSION_SECRET e CRON_SECRET com 32 bytes aleatórios ou mais. Não compartilhe no chat.

Para o primeiro dispositivo, gere código aleatório com ao menos 32 caracteres num gerenciador seguro; calcule SHA-256 localmente sem imprimir o original e configure DEVICE_BOOTSTRAP_HASH. Guarde o código original no cofre e use-o uma única vez em Primeiro acesso / recuperação. O código não é o PIN. Após consumo, retire o hash do ambiente até uma eventual recuperação ou mantenha-o inutilizado pela tabela bootstrap_uses.

Para novos dispositivos por e-mail, configure AUTHORIZED_EMAIL exato, RESEND_API_KEY, EMAIL_FROM e EMAIL_MODE=resend somente depois de homologar envio. O botão de autorização não aceita outro destinatário. Sem e-mail, novos códigos de recuperação só são gerados pela infraestrutura com MFA. O perímetro de dispositivos é sempre obrigatório, inclusive localmente.

Verifique formatos: `npm run verify:env`. Este comando não testa conectividade nem envia mensagens.

## Vercel

Importe o repositório numa conta autorizada. Framework Next.js, Node 22, comando de instalação `npm ci --legacy-peer-deps`, build `npm run build`. Configure segredos para os ambientes corretos; não reutilize dados reais em preview público. Rode checks antes do deploy. Configure domínio/HTTPS somente quando autorizado. Não houve deploy nesta execução.

Autorize o primeiro dispositivo no domínio final; os cookies pertencem ao domínio e não migram automaticamente do localhost. Teste os cenários A–V de docs/test-matrix.md em homologação antes de liberar a equipe.

## Validação pós-deploy

Verifique bloqueio anônimo de páginas/APIs, RLS/grants, bucket privado, dispositivo novo/revogado, PIN incorreto e rate limit, confirmação adulterada/expirada, retirada concorrente, relatório, upload/download privado e nova versão. Só depois configure agendador POST protegido e envio real de e-mail. Registre limitações do plano, limites de execução, armazenamento e custos do provedor.
