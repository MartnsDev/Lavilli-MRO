# Configuração Supabase

Projeto autorizado: `ecyzjuhryfqqpqoskyth`, URL `https://ecyzjuhryfqqpqoskyth.supabase.co`. CLI utilizado: 2.122.0. PostgreSQL remoto: 17.11.0.003. Nenhum outro projeto foi vinculado ou alterado.

## Realizado

- Vínculo do CLI confirmado para o projeto informado. `supabase init` não foi repetido, pois o repositório já contém configuração e migrations.
- Inspeção remota confirmou ausência de tabelas no esquema público antes da aplicação.
- Histórico de migrations consultado e `db push --dry-run` revisado.
- Aplicadas as seis migrations aditivas versionadas, sem seeds fictícias nem reset.
- SQL remoto confirmou 42 tabelas públicas e RLS ativa em todas, duas pessoas responsáveis iniciais, seis migrations aplicadas e bucket de documentos privado.
- Negação de SELECT operacional e EXECUTE de mutation confirmada para `anon`.
- Verificação pelo SDK real confirmou leitura administrativa, leitura e RPC anônimas negadas e bucket privado.
- Chave de servidor obtida pela sessão autenticada do CLI, sem exibir seu valor. Segredos de sessão/job e primeiro dispositivo gerados localmente. Nenhuma senha, chave secreta ou token foi enviada ao GitHub.
- Corrigido transporte SDK no Node 20 com `ws`, incluindo scripts de backup/restore e teste de regressão.

## Validação do código após a configuração

Lint, TypeScript, formatação, verificação de padrões de segredos, 15 testes unitários e build de produção passaram. A inspeção dos arquivos públicos de `.next/static` não encontrou valores reais de chave de servidor, segredo de sessão/job ou código de primeiro dispositivo. Isso não substitui os testes de fluxo autenticado no navegador.

## Primeiro acesso do proprietário

A senha que foi digitada anteriormente não tinha um hash cadastrado no servidor. Isso foi identificado como causa do erro genérico e corrigido pelo fluxo explícito de configuração inicial.

1. Abra `http://localhost:3000/login` no ambiente local de desenvolvimento.
2. Em **Defina a senha do hangar**, informe o código privado do arquivo `.local-secrets/device-bootstrap.txt` e defina/confirme a senha de quatro dígitos.
3. Autorize o dispositivo com um nome reconhecível; o código fica preenchido somente na memória daquela tela.
4. Entre com a senha definida.

O código é diferente do PIN, é consumido uma única vez na autorização do dispositivo e nunca deve ser compartilhado pelo chat. A definição inicial não consome o código antes da etapa de autorização. O aplicativo não permite reinicializar uma senha já cadastrada.

Alternativa pelo terminal: `npm run configure:pin`, seguido de `npm run verify:env`. O hash é gravado em formato portável para sobreviver ao carregamento dotenv do Next. Nenhum PIN real do proprietário foi escolhido pelo assistente.

## Ainda não validado

O PIN do proprietário não foi definido pelo assistente. Não houve primeiro login de dispositivo nem mutation operacional com essa identidade. Upload/versionamento/retorno de URL assinada, fluxos autenticados no navegador, câmera, Resend, cron, restauração de objetos reais e deploy HTTPS continuam pendentes. Nenhum e-mail foi enviado e nenhum arquivo fictício foi carregado no projeto remoto.

## Cuidados com credenciais

`.env.local`, `.local-secrets/`, `supabase/.temp/` e `supabase/.branches/` não são versionados. A chave publicável não substitui a chave de servidor. O campo `SUPABASE_SERVICE_ROLE_KEY` também aceita a chave moderna `sb_secret_`, mantida exclusivamente no servidor. A URI PostgreSQL com `[YOUR-PASSWORD]` continua sendo apenas um modelo: não foi salva como uma conexão funcional. O CLI realizou as operações autorizadas com sua sessão, sem necessidade de receber a senha do banco pelo chat.

## Nova validação do acesso e design

A revisão acrescentou testes de definição local em arquivos temporários, concorrência, recusa em produção, códigos incorretos/consumidos, senha incorreta, dispositivo revogado e cookie HttpOnly/Secure. O teste do carregador dotenv real do Next confirmou que a representação portável preserva o hash. As rotas de autenticação usam banco/cookies simulados em testes unitários; nenhum dispositivo fictício foi criado no Supabase real e o PIN do proprietário não foi substituído. A interface foi testada em Chrome automatizado em desktop e celular, incluindo primeiro acesso e persistência de tema.
