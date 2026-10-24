# Backup e teste de restauração

O backup do banco **não contém os bytes dos arquivos do Supabase Storage**. Mantenha cópias independentes do esquema/dados operacionais e dos objetos, em armazenamento separado, cifrado e com acesso restrito. Defina RPO/RTO, retenção e responsável pela restauração com a organização. Não presuma PITR ou retenção do plano contratado.

## Criar e verificar

O script exige pg_dump compatível com o PostgreSQL do destino e variáveis DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY no ambiente protegido:

```bash
node --env-file=.env.local scripts/backup.mjs /destino-separado/backup-novo
node scripts/verify-backup.mjs /destino-separado/backup-novo
```

A pasta deve ser nova. O dump inclui **somente public**, onde ficam todas as tabelas da aplicação; não é backup integral da infraestrutura Supabase nem de usuários do serviço Auth gerenciado. Os arquivos são baixados separadamente do bucket operational-documents com manifesto de caminhos, tamanho, MIME e SHA-256. Permissões de arquivos 0600 e pasta 0700. O script não cifra os arquivos por conta própria: use destino cifrado e transporte protegido.

Faça snapshot em janela sem mutations/upload para consistência entre banco e objetos. Sem pausa, o pg_dump é consistente no banco, mas os objetos podem mudar durante o percurso. Confira manifesto contra document_versions após a cópia. Script não promete snapshot atômico entre os serviços.

## Restaurar em destino isolado

1. Crie projeto/banco separado, sem dados reais. Revise versão, extensões e papéis necessários. Nunca aponte restauração para o projeto em uso.
2. Inspecione `pg_restore --list database.dump`. Restaure em destino descartável sem esquema público (o dump inclui sua criação), com `pg_restore --dbname=lavilli_restore_isolado --no-owner --exit-on-error database.dump`. Use variáveis PG*; não copie URI com senha para histórico. Não use `--clean` automaticamente.
3. O dump preserva grants/revogações; os papéis Supabase precisam existir no destino. Confira essas permissões contra as migrations. Verifique todas as RPCs e RLS antes de expor a API. Configure bucket privado conforme migration Storage sem sobrescrever catálogo gerenciado.
4. Defina RESTORE_SUPABASE_URL e RESTORE_SERVICE_ROLE_KEY do projeto isolado, e ALLOW_ISOLATED_RESTORE=YES. Execute `node scripts/restore-storage.mjs /pasta-do-backup`. O script rejeita destino igual à origem configurada e não sobrescreve objetos existentes.
5. Valide contagens, saldos, auditoria, ferramentas abertas, hashes e versões. Teste downloads autenticados e negação anônima. Use segredos de homologação, e-mails desativados e revogue dispositivos/sessões copiados antes de qualquer abertura externa.
6. Registre resultado e tempo da recuperação. Migração de tráfego/domínio exige decisão de infraestrutura separada.

`scripts/test-db.sh` inclui dump/restore em banco descartável e valida dados restaurados. Isso verifica a parte PostgreSQL local; Storage real, permissões Supabase pós-restore e consistência integral ainda exigem homologação com credenciais.
