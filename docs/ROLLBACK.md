# Retorno de versão e recuperação

A versão publicada inicialmente é `a3fcb179b05f07231d173f9bddf55a8ebcfd3ae4`, deployment `dpl_9R54g1McGtbfuxnMjVTKe7mDZ7Af`, domínio `https://lavilli-control.vercel.app`. Não havia publicação anterior deste projeto. Evidências em [DEPLOYMENT_REPORT.md](DEPLOYMENT_REPORT.md).

Não executar rollback destrutivo de schema. Preservar migrations e dados. A publicação inicial não aplicou a migration 009: código e banco não devem ser revertidos como se ela estivesse aplicada. O acesso vigente é nome e senha compartilhada, sem códigos ou autorização manual de aparelhos.

Se surgir falha grave, conter o acesso no projeto Vercel e corrigir em uma branch. Reimplantar somente código comprovadamente compatível com o schema remoto e com as credenciais atuais. Conferir domínio, origem, cookies e login após a troca. Como não existe implantação anterior validada, não promover o baseline antigo para improvisar um rollback. Atualizações de banco devem ser migrations progressivas revisadas e autorizadas.

Restaurar dados primeiro em destino isolado, com papéis Supabase compatíveis, incluindo banco, buckets privados e objetos. Configurar novas credenciais, reconciliar os dados e executar testes antes de solicitar recuperação real. `restore-storage.mjs` recusa o projeto de produção. Nunca sobrescrever produção com fixtures.

Meta recomendada: RPO 24h e RTO 4h, sem garantia até ensaio integral cronometrado. O teste atual cobre dump/restore SQL local; não valida falha regional, DNS, Vercel ou Storage inteiro. Backup real e restauração integral continuam pendentes.
