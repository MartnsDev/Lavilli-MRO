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
- Prova de capacidade do banco expira: aplicação aquecida não permanece presa ao schema anterior depois da atualização autorizada.

## Backup e mudança do banco

O proprietário autorizou explicitamente o backup local e a migration 009. O backup autenticado AES-256-GCM foi criado em `backups/pre-camera-20261025/backup.enc`, com chave separada, permissões restritas e exclusão do Git/deploy. Não há valores de credenciais neste relatório.

A restauração foi validada em PostgreSQL 17 descartável, sem rede e sem portas publicadas. A migration 009 aplicada nessa cópia preservou as contagens e hashes de todos os valores e colunas originais das 42 tabelas. RLS e revogações foram conferidos. Existiam zero objetos privados no instante do backup; isso não prova restauração de um acervo real de documentos nem backup integral do serviço Supabase Auth.

O dry-run remoto listou somente `202610240009_security_boundary.sql`. A aplicação remota e o deploy serão registrados abaixo apenas após sua execução e verificação.

## Antivírus operacional

Executar no computador autorizado, na raiz do projeto:

```bash
CLAM_DATABASE_DIR=/tmp/lavilli-clamav-camera npm run security:worker
```

Exige ClamAV/freshclam e `.env.local` privado. O worker consulta arquivos pendentes, verifica hash/tamanho, analisa localmente e registra o parecer. Atualiza assinaturas oficiais; recusa definições com mais de três dias, erro de scanner ou estouro de limites. O estado local fica em `.local-secrets/scanner-status.json`, sem conteúdo de documentos.

As assinaturas 28164 de 25/10/2026 foram atualizadas e testadas: amostra limpa aceita e arquivo de teste EICAR bloqueado. Esses testes não enviaram documentos privados a terceiros. O worker precisa do computador ligado e de conectividade; não existe serviço de antivírus 24 horas contratado. Se parar, arquivos permanecem privados e pendentes.

## Evidências e limites

- 81 testes unitários aprovados, incluindo parser, scanner, criptografia, transição de schema e proteções existentes.
- Build de produção compilado e verificado por TypeScript; regressão integrada em execução no banco local isolado.
- Fluxo real de OCR em worker/WASM passou com imagem sintética, edição dos campos, cadastro, vínculo e upload. O parecer de scanner dos testes de interface é simulado exclusivamente no banco local; a execução do antivírus real foi validada separadamente, incluindo download de uma foto privada de ensaio, hash e registro do parecer no banco local.
- A câmera de vídeo automatizada usa stream sintético, com testes de permissão negada e cancelamento tardio. É necessário conferir foco, iluminação e permissão nos celulares reais de César e Maranhão.
- OCR não garante precisão total. HEIC depende do suporte do navegador; quando não decodificado, a interface orienta usar JPEG/PNG.
- Não foram inseridas peças, documentos de ensaio ou fixtures no banco real para validar a publicação.
