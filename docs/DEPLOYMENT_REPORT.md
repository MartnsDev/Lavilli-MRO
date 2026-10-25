> Estado atual em 25/10/2026: câmera/OCR publicados, migration 009 aplicada com preservação conferida, upload habilitado e scanner local ativo. Ver [CAMERA_OCR_REPORT.md](CAMERA_OCR_REPORT.md) e [camera-verification.json](camera-verification.json). Os dados abaixo registram a primeira publicação e suas pendências históricas.

> Atualização posterior: a correção de disponibilidade de documentos foi publicada e verificada. Veja [PART_DOCUMENT_VERIFICATION.md](PART_DOCUMENT_VERIFICATION.md) para a versão atual e seus limites. O registro abaixo descreve a primeira publicação.

# Publicação e verificação — Lavilli Control

24/10/2026, America/Sao_Paulo. O proprietário autorizou configurar e publicar. **Publicação concluída e acesso verificado** em https://lavilli-control.vercel.app. Isso não declara conclusão integral do produto nem certificação de segurança.

## Implantação

| Item                       | Resultado                                              |
| -------------------------- | ------------------------------------------------------ |
| Repositório                | `https://github.com/MartnsDev/Lavilli-MRO`             |
| Commit de código publicado | `a3fcb179b05f07231d173f9bddf55a8ebcfd3ae4`             |
| Projeto / equipe           | `lavilli-control` / `matheus-s-projects-3ebcc424`      |
| Deployment                 | `dpl_9R54g1McGtbfuxnMjVTKe7mDZ7Af`                     |
| Estado Vercel              | READY, destino production, domínio principal atribuído |
| Runtime / região           | Node 22.x / iad1                                       |
| Backend                    | Supabase existente, preservado                         |
| Migrations remotas         | Oito existentes preservadas; 009 não aplicada          |
| E-mail / cron / scanner    | Não ativados                                           |
| Git automático / Preview   | Desativados                                            |
| Cobrança                   | Nenhum upgrade/serviço pago ativado                    |

Nove variáveis de infraestrutura foram configuradas criptografadas na Vercel; somente seus nomes aparecem em DEPLOY_GUIDE.md. `.env.local`, arquivos privados, chaves, backups e dados de teste foram excluídos do upload. O código fixa Node 22.x para manter o runtime de deploy e CI alinhados.

## Evidência em HTTPS real

Playwright com Chrome, contexto novo para cada mecânico, desktop 1366×768 e celular 390×844:

- Página pública de login retornou 200, com nome e senha, sem código administrativo ou etapa de autorização de aparelho e sem exigência de conta Vercel.
- César e Maranhão entraram com a senha compartilhada configurada pelo proprietário; ambos abriram o dashboard.
- Saúde autenticada retornou 200 e banco disponível; anônima retornou 401 antes do login e depois do logout.
- Cookies de autenticação usam prefixo `__Host-`, Secure, HttpOnly, SameSite=Strict e caminho `/`.
- CSP com nonce, HSTS e cache privado/no-store presentes no login.
- Oito rotas abriram com status 200 e título visível: dashboard, leitor QR, catálogo, lotes, localizações, ferramentas, aeronaves e tarefas.
- Menu móvel abriu e fechou por Escape; logout dos dois mecânicos retornou ao login.
- Nenhum erro JavaScript coletado nesses percursos.

Resultados sanitizados: [deployment-verification.json](deployment-verification.json). Somente autenticação e leituras foram exercitadas no backend real. Login/logout criam/revogam sessões e eventos normais de acesso; não houve gravação de registros operacionais, fixtures, exportação de documentos, backup real ou teste destrutivo. Não foram capturadas telas com registros reais.

## Verificação local

45 testes unitários passaram antes do deploy, assim como lint e typecheck. O build de produção na Vercel concluiu com sucesso. A verificação de padrões de credenciais no código passou; a comparação adicional com os quatro valores secretos de produção não encontrou correspondências nos arquivos do clone enviado. A rodada completa terminou com **177/177 testes integrados aprovados em 12,2 minutos**, no Supabase local isolado: Firefox, Chrome desktop, celular, APIs, Storage e matriz visual. A matriz percorreu 46 rotas, dois temas e 12 larguras (1.104 medições). Nenhuma fixture foi enviada ao banco remoto.

Os testes locais de escrita, transações, concorrência e Storage não equivalem a homologação desses fluxos no backend remoto com schema anterior. Consulte [RELEASE_READINESS.md](RELEASE_READINESS.md), [ACCESS_POLICY.md](ACCESS_POLICY.md) e [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).

## Pendências e limites para uso profissional

- A migration 009 e sua infraestrutura de segurança complementar não foram aplicadas. A versão publicada suporta o schema anterior para acesso e operações básicas, mas recursos dependentes de importação privada, scanner/quarentena e lease de jobs continuam pendentes de homologação remota. Não demonstrar esses recursos como concluídos na nuvem.
- Scanner operacional, entrega de e-mails, cron, backup externo, retenção e restauração integral banco+Storage não comprovados. RPO 24h/RTO 4h são metas propostas, não SLA.
- A senha de quatro dígitos compartilhada foi mantida por decisão expressa do proprietário. Não há atribuição individual forte nem código adicional.
- O plano atual é Hobby. A [política da Vercel](https://vercel.com/docs/limits/fair-use-guidelines) exige Pro ou Enterprise para uso comercial; o plano precisa ser regularizado antes do uso empresarial. Não foi contratado upgrade.
- Câmera/leitor QR, teclado, downloads e fluxos de campo precisam de validação no aparelho real. Recursos amplos ainda parciais constam em KNOWN_LIMITATIONS.md.

Para novas publicações e recuperação, usar [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) e [ROLLBACK.md](ROLLBACK.md). Não aplicar migrations ou restaurar dados reais como parte de um rollback de código.
