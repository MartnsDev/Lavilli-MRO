> Atualização do acesso: o fluxo atual usa somente César ou Maranhão e a senha geral pré-configurada, com entrada direta no dashboard. Referências abaixo a bootstrap, OTP ou autorização de dispositivos são históricas e foram substituídas por `202610240007_shared_login.sql`. Consulte o manual e deployment atuais.

# Segurança

A senha geral é compartilhada e curta; jamais é o único perímetro público. Toda entrada requer cookie de dispositivo autorizado por token aleatório de 256 bits, assinado por HMAC e persistido apenas como hash no banco. O bootstrap exige código com ao menos 32 caracteres, guardado no ambiente como SHA-256 e consumido uma única vez. OTP de seis dígitos expira em dez minutos e é vinculado a um cookie de navegador. Seu destinatário vem do ambiente, nunca de parâmetros do visitante.

Após autorizar o dispositivo, o servidor verifica o PIN via Argon2id. Sessão: token opaco aleatório + assinatura HMAC, hash no banco, oito horas, HttpOnly, SameSite=Strict, Secure em produção. Dispositivos expiram em 90 dias. Cada leitura verifica sessão e dispositivo não revogados. Revogar dispositivo invalida sessões no banco.

Cada mutation exige Origin igual ao APP_URL, sessão válida, responsável ativo e senha redigitada no servidor. A confirmação dura dois minutos, contém hash canônico do comando e da chave de idempotência e é consumida na transação. A API não aceita actor_id arbitrário. Retries com mesma operação retornam resultado persistido; mesmo identificador com conteúdo/sessão diferente é negado.

Cinco tentativas por janela de 15min por IP/dispositivo e finalidade, persistidas com atualização atômica. PIN correto limpa tentativas daquela finalidade; falhas consomem o limite. No Vercel, o IP é obtido do cabeçalho da plataforma `x-vercel-forwarded-for`; fora dele o bucket é conservadoramente compartilhado (`local`) para não confiar em X-Forwarded-For falsificável. Antes de usar outro proxy, adapte e teste a origem confiável. Recomenda-se rate limit adicional no perímetro de infraestrutura, sem perfis organizacionais.

A chave administrativa Supabase ignora RLS: está isolada em `server-only`, e autorização nas APIs/repositórios é obrigatória. Todas as tabelas têm RLS e grants que negam acesso direto às roles públicas. Todas as RPCs SECURITY DEFINER fixam search_path e revogam EXECUTE público. O cliente não recebe chave privilegiada.

Uploads: até 4 MB, PDF/PNG/JPEG, assinatura inicial, extensão e MIME; armazenamento privado com caminho aleatório e SHA-256. Sem HTML/SVG enviado pelo usuário. Arquivos são baixados, não incorporados como HTML. Isso não é antivírus; arquivos de fontes externas continuam sujeitos a conferência. Metadados são auditados, sem PIN/OTP/tokens.

CSP restringe origens, frame-ancestors, form-action e objetos. Hidratação Next e inicialização de tema ainda usam script inline: CSP com nonce estrito está pendente. Textos são escapados por React; HTML de etiquetas é escapado explicitamente. Segredos, stacks e payloads de erros não são enviados ao cliente.

Responsável informado é autodeclarado. Logs técnicos são estruturados e mínimos; mensagens de erro de fornecedor e credenciais não são registradas. Eventos automáticos usam ator Sistema. Revise retenção e privacidade com a organização antes de produção. Valor `retention_days` é configuração declarativa: não apaga dados automaticamente.

Proteja o painel Supabase/Vercel e recuperação com MFA e acesso de infraestrutura. Não habilite credenciais privilegiadas no navegador, não publique um ambiente com banco real antes da homologação e não use a base de testes como produção.

## Inicialização local e formato do hash

`POST /api/auth/initialize` existe somente para primeira configuração local. Exige NODE_ENV=development, APP_URL em loopback, Origin válido, código de recuperação de alta entropia válido e não consumido, confirmação do PIN e limite de tentativas. Em produção/nome remoto ele é recusado antes de chamar o banco. Um arquivo de lock e gravação por rename impedem substituições concorrentes. Só o hash é persistido em `.env.local`, permissão 0600; PIN/código não entram na auditoria. O evento usa Sistema. Arquivo e banco não formam uma transação distribuída: falha de auditoria após gravação gera aviso estruturado para manutenção, sem desfazer a configuração segura.

O valor local PIN_HASH é `argon2id:` seguido do hash Argon2id codificado em base64url; essa representação não contém `$` e não sofre expansão pelo dotenv do Next. A codificação não substitui o hash nem reduz seu custo. Hash cru é aceito quando injetado diretamente pelo provedor. A API de status devolve somente flags de configuração/autorização, nunca valores de segredos. Origem exata continua obrigatória em produção; em desenvolvimento são aceitos aliases de loopback apenas no mesmo protocolo/porta.
