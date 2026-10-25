# Câmera, fotos e leitura de PN/serial

Atualização de 25/10/2026. Registro de implementação e validação; não é certificação de segurança.

## Fluxo implementado

1. Em **Ler etiqueta**, abrir a câmera para QR/código de barras ou fotografar/escolher uma imagem da galeria. A leitura funciona por biblioteca JavaScript, sem depender de BarcodeDetector.
2. Em **Ler PN e serial da foto**, fotografar o documento/etiqueta ou carregar a imagem. OCR em português e inglês roda no navegador, com modelos e WASM servidos pelo próprio site. A foto não é enviada para um serviço de OCR.
3. Conferir e corrigir PN e serial antes de continuar. OCR pode confundir 0/O e 1/I; não confirma cadastro sozinho. O catálogo exato é selecionado quando existe; um PN novo abre o cadastro do catálogo e preserva o serial para a próxima etapa.
4. Na ficha da peça, cadastrar o documento, confirmar seu vínculo e enviar a foto da leitura ou outra foto/arquivo. Os três passos exigem confirmação e deixam trilha operacional.
5. Fotos são normalizadas para JPEG, no máximo 3.000 pixels no lado maior e 4 MiB, retirando metadados. O original PDF continua disponível pelo envio de arquivo. O documento e a peça mantêm PN e serial separados.
6. O upload usa bucket privado, hash e quarentena. Download e visualização da foto só ficam disponíveis após parecer limpo. Nenhuma URL pública ou bearer URL é entregue ao navegador.

A foto em trânsito entre leitura e cadastro fica somente na memória do navegador por até 15 minutos. Não permanece em localStorage/IndexedDB; sair/recarregar elimina esse rascunho. Ela só vira documento persistente após a confirmação do upload.

## Correções encontradas pelos testes

- Seleção inicial de catálogo se perdia quando opções assíncronas terminavam de carregar; o seletor agora mantém seu valor.
- Formulários de alteração conservam a versão de abertura, impedindo aceitar silenciosamente uma versão mais nova com campos antigos.
- A devolução de ferramenta podia disputar a atualização da ficha com a próxima operação. Novos formulários aguardam a atualização por transição, e retirada/devolução têm identidades separadas. Um teste atrasa deliberadamente a resposta RSC e confirma esse bloqueio antes de continuar.
- Leituras de câmera encerram tracks ao navegar, cancelar, ocultar a aba e quando uma permissão tardia é resolvida depois do cancelamento.
- QR externo nunca navega para outro domínio; destinos internos têm entidade/UUID validados. Outros valores viram busca textual limitada.
- Detecção de PN e SN na mesma linha, números com zero inicial e rótulos em português/inglês cobertos por testes.
- O CI revelou QR válidos que o leitor de múltiplos formatos não reconhecia. Foi acrescentada leitura QR complementar, com 16 testes de padrões PNG/JPEG e repetição no navegador do código exato de regressão. Os seletores de arquivo na automação agora aguardam o estado habilitado, como ocorre no uso humano.
- Prova de capacidade do banco expira: aplicação aquecida não permanece presa ao schema anterior depois da atualização autorizada.

## Backup e mudança do banco

O proprietário autorizou explicitamente o backup local e a migration 009. O backup autenticado AES-256-GCM foi criado em `backups/pre-camera-20261025/backup.enc`, com chave separada, permissões restritas e exclusão do Git/deploy. Não há valores de credenciais neste relatório.

A restauração foi validada em PostgreSQL 17 descartável, sem rede e sem portas publicadas. A migration 009 aplicada nessa cópia preservou as contagens e hashes de todos os valores e colunas originais das 42 tabelas. RLS e revogações foram conferidos. Existiam zero objetos privados no instante do backup; isso não prova restauração de um acervo real de documentos nem backup integral do serviço Supabase Auth.

O dry-run remoto listou somente `202610240009_security_boundary.sql`. A migration 009 foi aplicada no projeto existente após a publicação do código compatível. A comparação remota de todas as colunas originais confirmou preservação dos valores nas 42 tabelas; as oito migrations anteriores continuam registradas. RLS e permissões foram rechecados.

## Antivírus operacional

Executar no computador autorizado, na raiz do projeto:

```bash
CLAM_DATABASE_DIR=/tmp/lavilli-clamav-camera npm run security:worker
```

Exige ClamAV/freshclam e `.env.local` privado. O worker consulta arquivos pendentes, verifica hash/tamanho, analisa localmente e registra o parecer. Atualiza assinaturas oficiais; recusa definições com mais de três dias, erro de scanner ou estouro de limites. O estado local fica em `.local-secrets/scanner-status.json`, sem conteúdo de documentos.

As assinaturas 28164 de 25/10/2026 foram atualizadas e testadas: amostra limpa aceita e arquivo de teste EICAR bloqueado. Esses testes não enviaram documentos privados a terceiros. O worker precisa do computador ligado e de conectividade; não existe serviço de antivírus 24 horas contratado. Se parar, arquivos permanecem privados e pendentes.

## Evidências e limites

- 97 testes unitários aprovados, incluindo parser, scanner, criptografia, transição de schema e proteções existentes.
- 207 testes integrados aprovados no CI da revisão final; baseline local com 204 e 30 cenários finais de câmera/leitura em Firefox, Chromium e celular; build, TypeScript, lint, formatação e verificação de dependências aprovados.
- Fluxo real de OCR em worker/WASM passou com imagem sintética, edição dos campos, cadastro, vínculo e upload. O parecer de scanner dos testes de interface é simulado exclusivamente no banco local; a execução do antivírus real foi validada separadamente, incluindo download de uma foto privada de ensaio, hash e registro do parecer no banco local.
- A câmera de vídeo automatizada usa stream sintético, com testes de permissão negada e cancelamento tardio. É necessário conferir foco, iluminação e permissão nos celulares reais de César e Maranhão.
- OCR não garante precisão total. HEIC depende do suporte do navegador; quando não decodificado, a interface orienta usar JPEG/PNG.
- Não foram inseridas peças, documentos de ensaio ou fixtures no banco real para validar a publicação.

## Publicação verificada

Disponível em https://lavilli-control.vercel.app/scan, no mesmo projeto e repositório autorizados. A verificação HTTPS final passou para César e Maranhão, com login, dashboard, cookies, menu móvel, negação anônima e capacidade de upload. A prova usa um corpo inválido de propósito e recebe 400, sem gravar arquivos ou registros.

O QR fotográfico e o OCR real também passaram em HTTPS, usando imagem sintética processada no navegador: PN e serial preenchidos corretamente, zero POST de foto, zero recurso externo e zero erro de execução. Não foram criados registros operacionais de ensaio em produção. O transporte real do Storage foi conferido com um único PNG técnico temporário: upload sem sobrescrita, hash no download, negação anônima e remoção somente desse objeto. Ele não gerou cadastro de peça/documento. Isso não equivale a testar todas as escritas operacionais com dados reais.

O scanner local foi iniciado como serviço de usuário `lavilli-document-scanner.service`, com reinício em caso de falha e início automático na sessão deste usuário. Verificar com `systemctl --user is-active lavilli-document-scanner.service`; parar com `systemctl --user stop lavilli-document-scanner.service`. O worker usa Node 22.23.4 obtido da distribuição oficial com SHA-256 conferido, sem alterar o Node padrão dos demais projetos. O serviço é persistente e foi habilitado para iniciar na sessão deste usuário; não foi ativada execução sem sessão ou infraestrutura externa. A infraestrutura com disponibilidade 24 horas continua pendente.

Evidências sanitizadas, commit e horários: [camera-verification.json](camera-verification.json). A precisão do OCR e o funcionamento da câmera no aparelho físico ainda exigem conferência da equipe.
