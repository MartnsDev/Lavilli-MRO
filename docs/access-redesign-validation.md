# Revisão visual e correção de acesso

## Causa e solução

A configuração local estava sem PIN_HASH. O formulário anterior permitia tentar login mesmo assim, resultando em “Configuração do servidor pendente”. O acesso agora consulta um estado seguro de configuração: sem PIN local, exibe o formulário de primeira definição; sem dispositivo, exige autorização; somente depois apresenta o login com PIN. E-mail de autorização só aparece quando seu serviço estiver configurado.

A primeira definição pelo navegador exige código forte de recuperação válido e ainda não consumido, confirmação do PIN, Origin válido, limite de tentativas, NODE_ENV=development e hostname de loopback. A senha não é escolhida pelo assistente. A gravação é atômica em arquivo local com permissão 0600 e não sobrescreve um PIN existente. Produção recusa a inicialização por navegador e continua usando segredo de ambiente.

Também foi corrigida a representação do hash: `$` do Argon2 pode ser expandido pelo carregador dotenv. O valor local passa a ser `argon2id:` + base64url do hash, testado com o carregador real do Next. Hash cru continua aceito quando injetado pelo provedor. `npm run pin:normalize` converte somente a representação de um hash local antigo, sem redefinir a senha. A verificação central atende login e confirmações operacionais.

## Referência visual

O site institucional forneceu logo original, Montserrat Regular/Bold e a paleta #051C2C / #125572 / #E2B476. A tela usa composição ampla com fotografia do hangar, título de destaque, logo integrado ao cabeçalho claro e botões dourados retangulares. Menu e botões compartilham a identidade. Fontes locais incluem licença OFL. O indicador de desenvolvimento foi ocultado para não cobrir controles móveis.

## Verificações executadas

- Lint, TypeScript, formatação, scanner de padrões de segredo e build passaram.
- 37 testes unitários passaram: provas de recuperação, recusa em produção, gravação em diretórios temporários, concorrência da inicialização, hash portável/recarga dotenv, PIN correto/incorreto, dispositivo não autorizado e cookie seguro.
- 16 testes HTTP/UI passaram contra o servidor local: 12 de APIs/bloqueios e 4 Chrome desktop/mobile.
- Capturas claro/escuro revisadas; dimensões de teste 1280×900 e 390×844, sem overflow horizontal.
- Não foi necessário alterar migrations ou dados operacionais do Supabase.

## Limites da evidência

A inicialização positiva usa diretórios temporários e banco simulado nos testes unitários. As rotas de login são testadas com PINs aleatórios de teste, cookies e banco simulados, incluindo a validação criptográfica real. O navegador verifica layout/tema/primeiro acesso no servidor real, sem escolher o PIN real do proprietário, consumir seu código ou criar dispositivos fictícios no Supabase remoto. O primeiro login operacional do proprietário deve ser concluído na própria tela. Não enviar PIN ou código pelo chat.
