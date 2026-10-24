# Configuração e deploy

## Preparar Supabase

Use projeto dedicado. Aplique cada arquivo de `supabase/migrations` em ordem no destino revisado, pelo SQL Editor/CLI com mecanismo de controle de migrations. Produção não usa reset nem migrations destrutivas automáticas. O arquivo Storage exige Supabase real; testes PostgreSQL usam apenas catálogo mínimo para conferir sua sintaxe.

Para Supabase local, Docker precisa estar disponível: `npx supabase start`. Este ambiente não possuía acesso ao daemon Docker; as regras de domínio foram testadas com PostgreSQL 16 isolado. Leia a saída local de configuração no terminal privado e nunca a grave no repositório.

## Segredos

Copie `.env.example` para `.env.local` (ignorado). Configure APP_URL, SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no servidor. Em produção APP_URL deve ser o endereço HTTPS exato. Nenhuma variável operacional usa NEXT_PUBLIC_.

No ambiente **local de desenvolvimento**, o primeiro acesso em `/login` oferece definição da senha no navegador. Exige APP_URL em loopback (`localhost`/`127.0.0.1`), infraestrutura configurada e o código privado de recuperação ainda não consumido. O código prova acesso do proprietário à instalação; a senha de quatro dígitos sozinha não inicializa o sistema. O formulário grava somente o hash Argon2id em `.env.local` com permissão 0600 e impede sobrescrever uma senha existente. Depois, autorize o dispositivo e entre normalmente.

A inicialização pelo navegador é recusada em produção ou em hostname não local. Em hospedagem, configure PIN_HASH no ambiente seguro. A alternativa local pelo terminal é:

Defina a senha geral diretamente no seu terminal, sem inserir o PIN no chat, em argumentos ou no histórico:

```bash
npm run configure:pin
```

O comando solicita e confirma quatro dígitos com entrada mascarada e grava somente o hash Argon2id em representação portável (`argon2id:` + base64url do hash). Isso impede que o carregador dotenv do Next interprete os caracteres `$` do hash. O servidor também aceita hashes Argon2id crus fornecidos diretamente pelo cofre da hospedagem. O hash e a senha não são exibidos. Para rotação consciente de senha já configurada, use `npm run configure:pin -- --rotate`.

Em produção, transfira PIN_HASH ao cofre/ambiente de infraestrutura por canal seguro. Use um gerenciador de senhas para gerar SESSION_SECRET e CRON_SECRET com 32 bytes aleatórios ou mais. Não compartilhe no chat.

Para o primeiro dispositivo, gere código aleatório com ao menos 32 caracteres num gerenciador seguro; calcule SHA-256 localmente sem imprimir o original e configure DEVICE_BOOTSTRAP_HASH. Guarde o código original no cofre e use-o uma única vez em Primeiro acesso / recuperação. O código não é o PIN. Após consumo, retire o hash do ambiente até uma eventual recuperação ou mantenha-o inutilizado pela tabela bootstrap_uses.

Para novos dispositivos por e-mail, configure AUTHORIZED_EMAIL exato, RESEND_API_KEY, EMAIL_FROM e EMAIL_MODE=resend somente depois de homologar envio. O botão de autorização não aceita outro destinatário. Sem e-mail, novos códigos de recuperação só são gerados pela infraestrutura com MFA. O perímetro de dispositivos é sempre obrigatório, inclusive localmente.

Verifique formatos: `npm run verify:env`. Este comando não testa conectividade nem envia mensagens.

## Vercel

Importe o repositório numa conta autorizada. Framework Next.js, Node 22, comando de instalação `npm ci --legacy-peer-deps`, build `npm run build`. Configure segredos para os ambientes corretos; não reutilize dados reais em preview público. Rode checks antes do deploy. Configure domínio/HTTPS somente quando autorizado. Não houve deploy nesta execução.

Autorize o primeiro dispositivo no domínio final; os cookies pertencem ao domínio e não migram automaticamente do localhost. Teste os cenários A–V de docs/test-matrix.md em homologação antes de liberar a equipe.

## Validação pós-deploy

Verifique bloqueio anônimo de páginas/APIs, RLS/grants, bucket privado, dispositivo novo/revogado, PIN incorreto e rate limit, confirmação adulterada/expirada, retirada concorrente, relatório, upload/download privado e nova versão. Só depois configure agendador POST protegido e envio real de e-mail. Registre limitações do plano, limites de execução, armazenamento e custos do provedor.

## Configuração local realizada

O projeto `ecyzjuhryfqqpqoskyth` foi vinculado pelo CLI 2.122.0. O PostgreSQL remoto é 17; a configuração local foi alinhada a essa versão. As seis migrations foram aplicadas após inspeção do esquema público vazio e dry-run. Detalhes e verificações estão em [infrastructure-setup.md](infrastructure-setup.md).

O `.env.local`, `.local-secrets/` e `supabase/.temp/` são privados e ignorados pelo Git. O arquivo `.local-secrets/device-bootstrap.txt` contém o código de primeiro dispositivo, que o proprietário deve abrir localmente e não compartilhar. O código é consumido uma única vez.

Caso uma instalação anterior tenha um hash Argon2id cru salvo no `.env.local`, `npm run pin:normalize` converte somente a representação para o formato portável, sem alterar o PIN. Isso corrige a expansão de `$` pelo Next; não redefine senhas nem substitui um hash já inválido.
