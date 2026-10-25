# Ambiente online isolado para testes

O proprietário solicitou uma URL de testes com dados fictícios e testes automatizados do deploy. **A URL de testes ainda não foi publicada.** A automação está disponível; o backend separado depende da decisão de infraestrutura pendente.

## Preparado

- Projeto Vercel `lavilli-control-test`, ID `prj_wL44YPVBCUzQjwIHsj5nQzttlgib`, na mesma equipe existente e exclusivamente ligado a `MartnsDev/Lavilli-MRO`.
- Domínio planejado: `lavilli-control-test.vercel.app`. Não compartilhar como URL pronta enquanto não houver backend, implantação READY e teste aprovado.
- Node 22.x, região iad1, Next.js; auto deploy Git desativado, sem upgrade do plano existente.
- Proteção de configuração implementada: `APP_MODE=test` permanece restrito a loopback. `APP_MODE=demo` aceita remoto somente se `DEMO_SUPABASE_PROJECT_REF` corresponder exatamente ao host Supabase informado, for diferente do projeto real, `APP_URL` for o domínio canônico de teste em HTTPS e `EMAIL_MODE=disabled`. O banner existente da demonstração continua ligado nesse modo.
- Testes unitários comprovam rejeição do banco real como demo, referência divergente, URL enganosa, domínio de produção e envio de e-mail. O modo normal existente foi preservado.
- Nenhuma migration foi alterada. As nove migrations existentes serão usadas apenas no backend isolado explicitamente identificado; o projeto real não deve receber fixtures ou seeds.

## Bloqueio observado

A organização Supabase existente está no plano Free. A API/CLI listou dois projetos ACTIVE_HEALTHY; as duas vagas gratuitas estão ocupadas. A pré-verificação impediu a criação de um terceiro projeto, antes de qualquer requisição de criação. Nenhum outro projeto foi pausado ou excluído; nenhum plano pago foi ativado. O banco da Lavilli foi preservado.

Foi solicitado ao proprietário indicar outro backend de teste, avaliar qual projeto pode ser pausado ou avaliar um plano pago. Não executar nenhuma dessas alterações de disponibilidade/cobrança sem a decisão e, quando aplicável, autorização específica. Não criar contas para contornar quotas.

## Após disponibilizar o backend

1. Identificar o projeto separado e confirmar que não é o backend real nem contém registros operacionais a preservar. Não receber senhas ou chaves pelo chat; usar autenticação/arquivos privados locais ou secrets do provedor.
2. Aplicar migrations em workdir isolado, com destino conferido, sem alterar o vínculo Supabase do checkout de produção. Não usar reset no banco real.
3. Configurar na Vercel somente as credenciais desse projeto, hash da senha definida pelo proprietário e segredos de sessão/cron próprios; modo demo, e-mail desativado, URL canônica e referência explícita do backend de teste.
4. Criar dados exclusivamente fictícios, identificados como DEMO, por operações auditadas. Não copiar registros, documentos, sessões ou chaves do banco da oficina.
5. Usar checkout/binding Vercel separado: `deploy:checked` rejeita a associação entre domínio de teste e projeto de produção.
6. Publicar com autorização já concedida para esta versão de testes, validar os dois mecânicos e executar o teste automatizado. Testes de escrita na nuvem só podem usar o backend isolado, com proteção explícita de destino.
7. Verificar e documentar a condição de documentos: disponibilidade de upload não comprova scanner operacional. Arquivos novos devem permanecer em quarentena até verificação confiável; não simular pareceres em produção.

Não tratar o site atual, ligado ao banco da oficina, como sandbox. A demonstração local permanece separada e pode ser usada enquanto a infraestrutura online é definida.
