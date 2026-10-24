# Instalação e acesso

Configure Supabase, APP_URL, SESSION_SECRET e PIN_HASH no ambiente do servidor. Em desenvolvimento, use `.env.local` (ignorado pelo Git). `npm run configure:pin` grava o hash Argon2id da senha geral por entrada oculta; `npm run configure:pin -- --rotate` permite substituí-la.

Aplique as migrações até `202610240007_shared_login.sql`. O projeto deve conter os responsáveis ativos César e Maranhão. O formulário solicita somente nome e senha geral e abre diretamente `/dashboard`. Não configure autorização de dispositivo, OTP ou recuperação para esse acesso.

Use `npm run verify:env`, `npm run build` e `npm start`. Em hospedagem, configure os mesmos segredos privados e a URL final. A senha configurada localmente precisa ter seu hash configurado também no ambiente hospedado.

Valide login de ambos, saída, bloqueio anônimo, dashboard e operações em homologação. Storage privado, e-mails e agendador seguem a documentação operacional específica.
