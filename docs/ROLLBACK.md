# Retorno de versão e recuperação

Não executar rollback destrutivo de schema. Preservar migrations 001–009 e os dados. Não retirar a autorização de dispositivos para voltar ao fluxo PIN público.

Antes de entrega registrar commit anterior/novo, migrations remotas, env por ambiente e backup criptografado verificado. Se Preview falhar, retirar o acesso ao Preview e corrigir na branch; produção permanece intacta.

Se promoção autorizada falhar, bloquear acesso externo e reverter código apenas a uma versão compatível com o schema vigente. A versão anterior PIN-only não é fallback de segurança aceitável. Correções de schema devem ser migrations progressivas revisadas. Não renomear/remover run_operation_legacy manualmente nem apagar private_security.

Restauração: primeiro destino isolado com papéis Supabase compatíveis, restaurar dump public/private_security, buckets privados e objetos, configurar novas credenciais e sessões, executar todos os testes. Só após reconciliação e autorização realizar recuperação real. `restore-storage.mjs` recusa o projeto de produção. Não sobrescrever dados reais com fixtures.

Meta recomendada: RPO 24h e RTO 4h, sem garantia até ensaio integral cronometrado. O teste atual mede dump/restore SQL local; não valida falha regional, DNS, Vercel ou Storage inteiro.
