# Testes da aplicação publicada

O comando `npm run test:deploy` verifica o endereço HTTPS publicado sem criar cadastros operacionais, enviar arquivos ou baixar documentos reais. Login/logout criam e revogam sessões e eventos normais de acesso.

## Executar

```bash
DEPLOY_TEST_URL=https://lavilli-control.vercel.app \
DEPLOY_TEST_PIN_FILE=.local-secrets/demo-pin.txt \
npm run test:deploy
```

O arquivo privado deve ter permissão 0600. Alternativamente, fornecer `DEPLOY_TEST_PIN` por mecanismo de segredo do ambiente; nunca escrever o valor no comando, README ou Git. Em Linux/CI com navegador Playwright, configurar `PLAYWRIGHT_CHANNEL=chromium` após instalar `npx playwright install --with-deps chromium`; localmente o padrão usa Chrome.

Somente os domínios canônicos Lavilli são aceitos. O domínio `lavilli-control-test.vercel.app` está reservado na configuração do teste, mas **não representa uma implantação já disponível**. Não compartilhar esse endereço como versão pronta antes do provisionamento e verificação.

## Cobertura e significado

- Login de César e Maranhão, desktop e celular, sem códigos administrativos.
- Dashboard e saúde autenticada do banco.
- API de saúde negada antes do login e após logout.
- Cookies `__Host-`, Secure, HttpOnly, SameSite=Strict, CSP com nonce, HSTS e no-store.
- Menu móvel e ausência de erros JavaScript coletados.
- Disponibilidade básica de upload, usando uma requisição inválida que não envia arquivo nem chega ao Storage. Resposta 503 reprova a verificação padrão.

`npm run test:deploy -- --smoke-only` verifica somente acesso/navegação. Registra a indisponibilidade de documentos no JSON, mas permite sucesso desse modo limitado. Não usar esse resultado como prova de upload operacional, scanner configurado ou homologação funcional completa.

O resultado sanitizado fica em `test-results/deploy/result.json`. Não há capturas, traces, DOM real, PIN, cookies ou chaves no relatório. Erros detalhados do navegador não são impressos, pois podem conter os valores digitados. O teste aborta navegações e recursos fora da origem autorizada.

## GitHub Actions e Vercel

Workflow: `.github/workflows/deployment-tests.yml`, acionável em Actions → Deployment tests → Run workflow. Escolher o domínio e o modo; o padrão exige disponibilidade de documentos. O segredo de repositório `LAVILLI_DEPLOY_TEST_PIN` foi configurado criptografado exclusivamente em `MartnsDev/Lavilli-MRO`.

O workflow também escuta `vercel.deployment.success`, limitado a projetos/aliases Lavilli de produção. O domínio canônico é escolhido de uma lista fixa; nenhum URL arbitrário do evento recebe a senha. O teste verifica o endereço canônico após o evento; não constitui ensaio funcional de escrita nem prova de que todos os módulos estão homologados. O auto deploy Git continua desativado: habilitar testes por evento não autoriza novas publicações.

A integração usa o [evento documentado da Vercel](https://vercel.com/docs/git/vercel-for-github#repository-dispatch). Segredos são armazenados pelo [mecanismo de secrets do GitHub](https://docs.github.com/en/rest/guides/encrypting-secrets-for-the-rest-api).

## Estado atual

Execução local contra o HTTPS real: login dos dois perfis, dashboard, cookies, menu e logout aprovados. O modo padrão **reprovou corretamente** porque o upload retorna 503, conforme PART_DOCUMENT_VERIFICATION.md. Não houve tentativa de gravar registros operacionais.

A conta Supabase está no plano Free e possui dois projetos ACTIVE_HEALTHY. Nenhum banco novo foi criado, projeto pausado ou upgrade contratado. A URL de demonstração isolada depende de um backend separado a ser disponibilizado ou autorizado. Não copiar dados reais para a demo nem usar o banco da oficina para fixtures.

Também foi encontrada uma falha anterior de CI: a instalação do cliente PostgreSQL 16 falhava no runner `ubuntu-latest`, que estava migrando para Ubuntu 26. Os runners foram fixados em `ubuntu-24.04`; os resultados das novas execuções devem ser acompanhados antes de declarar a correção comprovada no GitHub.
