> Ensaio real em 25/10/2026: backup local cifrado criado com autorização, restauração PostgreSQL 17 isolada aprovada e valores originais das 42 tabelas preservados após 009. Existiam zero objetos privados no instante do backup. Isso não comprova recuperação de um acervo real, backup externo ou SLA. Ver [CAMERA_OCR_REPORT](CAMERA_OCR_REPORT.md).

# Backup e teste de restauração

O backup do banco **não contém os bytes dos arquivos do Supabase Storage**. Mantenha cópias independentes do esquema/dados operacionais e dos objetos, em armazenamento separado, cifrado e com acesso restrito. Defina RPO/RTO, retenção e responsável pela restauração com a organização. Não presuma PITR ou retenção do plano contratado.

## Criar e verificar

Meta recomendada aceita: RPO 24h / RTO 4h; não comprovada até ensaio integral.

O script exige BACKUP_KEY_FILE privado, pg_dump compatível com o PostgreSQL do destino e variáveis DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY no ambiente protegido:

```bash
node --env-file=.env.local scripts/backup.mjs /destino-separado/backup-novo
node scripts/verify-backup.mjs /destino-separado/backup-novo
```

A pasta deve ser nova. O dump inclui **public e private_security**; não é backup integral da infraestrutura Supabase nem de usuários do serviço Auth gerenciado. Os arquivos são baixados separadamente dos buckets operational-documents e import-originals com manifesto de caminhos, tamanho, MIME e SHA-256. Permissões de arquivos 0600 e pasta 0700. O arquivo final backup.enc usa AES-256-GCM autenticado; a chave hexadecimal de 32 bytes deve estar em BACKUP_KEY_FILE com permissão 0600, separada do destino e mantida sob custódia administrativa. Use transporte protegido e cópia offsite. O staging temporário é apagado ao terminar.

Faça snapshot em janela sem mutations/upload para consistência entre banco e objetos. Sem pausa, o pg_dump é consistente no banco, mas os objetos podem mudar durante o percurso. Confira manifesto contra document_versions após a cópia. Script não promete snapshot atômico entre os serviços.

## Restaurar em destino isolado

1. Crie projeto/banco separado, sem dados reais. Revise versão, extensões e papéis necessários. Nunca aponte restauração para o projeto em uso.
2. Inspecione `pg_restore --list database.dump`. Restaure em destino descartável sem esquema público (o dump inclui sua criação), com `pg_restore --dbname=lavilli_restore_isolado --no-owner --exit-on-error database.dump`. Use variáveis PG*; não copie URI com senha para histórico. Não use `--clean` automaticamente.
3. O dump preserva grants/revogações; os papéis Supabase precisam existir no destino. Confira essas permissões contra as migrations. Verifique todas as RPCs e RLS antes de expor a API. Configure bucket privado conforme migration Storage sem sobrescrever catálogo gerenciado.
4. Defina RESTORE_SUPABASE_URL e RESTORE_SERVICE_ROLE_KEY do projeto isolado, e ALLOW_ISOLATED_RESTORE=YES. Execute `node scripts/restore-storage.mjs /pasta-do-backup`. Para nuvem é obrigatório RESTORE_PROJECT_REF diferente do projeto real. O script bloqueia o projeto real e rejeita destino igual à origem configurada e não sobrescreve objetos existentes.
5. Valide contagens, saldos, auditoria, ferramentas abertas, hashes e versões. Teste downloads autenticados e negação anônima. Use segredos de homologação, e-mails desativados e revogue dispositivos/sessões copiados antes de qualquer abertura externa.
6. Registre resultado e tempo da recuperação. Migração de tráfego/domínio exige decisão de infraestrutura separada.

`scripts/test-db.sh` inclui dump/restore em banco descartável e valida dados restaurados. Isso verifica a parte PostgreSQL local; Storage real, permissões Supabase pós-restore e consistência integral ainda exigem homologação com credenciais.
