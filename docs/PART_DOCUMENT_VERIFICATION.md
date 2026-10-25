# Verificação de peça, serial e documento

24/10/2026, America/Sao_Paulo. Escopo: cadastro por Part Number (PN), unidade por Serial Number (SN), vínculo do documento, envio, quarentena e download privado.

**Resultado: o fluxo completo ainda não está disponível no site publicado.** A estrutura de PN/SN e vínculos existe no banco remoto. O envio e a liberação dos arquivos dependem de recursos ainda ausentes nesse banco e da operação do scanner. Não houve aplicação de migrations nem gravação de peças/documentos de teste em produção.

## Verificação remota sem registros de teste

Consultas com `limit(0)` e metadados da API no Supabase existente:

| Recurso                                                                  | Resultado                      |
| ------------------------------------------------------------------------ | ------------------------------ |
| Catálogo `part_catalog.part_number`                                      | Disponível                     |
| Unidade `part_instances.catalog_id, serial_number`                       | Disponível                     |
| Vínculo `document_links.document_id, entity, entity_id`                  | Disponível                     |
| Estado de verificação `document_versions.scan_status`                    | Ausente; erro PostgreSQL 42703 |
| Controle de cota `reserve_upload`                                        | Ausente nos metadados RPC      |
| Liberação por scanner `record_document_scan`                             | Ausente nos metadados RPC      |
| Indicador da migration de segurança `access_sessions.credential_version` | Ausente; erro PostgreSQL 42703 |

O envio anterior chamava `reserve_upload` sem verificar a capacidade do banco e resultaria em erro genérico. O download selecionava a coluna ausente e poderia informar documento não encontrado. Isso não era um fluxo operacional homologado na nuvem.

## Correções

- Tela de documento não oferece seletor de arquivo quando o banco ainda não suporta o fluxo seguro; mostra indisponibilidade e mantém o cadastro de referência/vínculo.
- API de upload responde 503 com mensagem específica antes de processar o arquivo ou tentar gravar no Storage.
- API de download responde 503 nesse mesmo cenário, preservando o bloqueio de arquivos não verificados.
- Autenticação, limites, quarentena e regras existentes foram preservados. Não foi criado um caminho de upload/download que dispense as proteções pendentes.

## Testes automatizados atuais

- **49/49 unitários aprovados**. Quatro casos novos cobrem indisponibilidade de envio/download, ausência de acesso ao Storage nesse cenário, exigência de autenticação e renderização da tela sem seletor de arquivo inutilizável. O teste de backup fictício falhou na primeira execução dentro do sandbox e passou na repetição da suíte fora dele, sem backup real. Não se alterou a implementação de backup nesta verificação.
- **8/8 testes integrados focados aprovados**, em 50,7 segundos, com build atual e Supabase exclusivamente local: Firefox, Chrome desktop, celular, transferência de serializados, upload, versões, vínculo e download.
- Novo cenário cria duas unidades com o mesmo catálogo e seriais diferentes, cadastra um documento e o vincula somente à primeira; envia PDF pela interface, comprova bloqueio inicial, simula parecer confiável de scanner somente no banco local, baixa os mesmos bytes e confirma que a segunda unidade não recebe o vínculo. O serial, catálogo e estado documental da peça permanecem corretos; anexar arquivo não altera automaticamente a condição técnica/documental.
- Lint e typecheck aprovados; build de produção local concluído.
- A rodada anterior de 177 testes integrados permanece evidência histórica da versão publicada inicialmente. Não se apresenta essa rodada como execução integral do código alterado nesta verificação.

## Para concluir o uso online

Revisar e aplicar a atualização de banco pendente pelo processo seguro de migração, com backup/restauração autorizados e validados; configurar scanner confiável com assinaturas atuais; homologar envio e download em backend remoto isolado. Não liberar documentos por simulação de parecer em produção. Não inserir fixtures no banco da oficina.

O PN identifica o item do catálogo; o SN identifica a unidade física. O arquivo é vinculado à unidade por seu registro, sem substituir o serial. A interface atual distribui cadastro, documentos e vínculos por telas separadas; não existe extração automática de PN/SN do PDF.

## Publicação da correção e confirmação online

Código `fbd3f6211a459d5efc4ad12b77f10aef23fbc370`, deployment `dpl_5aqbRF3Z8Dum5pzuGreBLrxb9MiZ`, estado READY e domínio principal https://lavilli-control.vercel.app.

Chrome em sessão nova: login aprovado; upload autenticado sem arquivo respondeu 503 específico antes de qualquer processamento; download de identificador fictício respondeu 503 específico; após logout, upload anônimo foi negado com 401. Nenhum erro JavaScript coletado. Não foram enviados ou baixados arquivos reais nem criados registros operacionais. A consulta limitada para localizar uma ficha de documento existente não retornou registro; portanto a tela de documento real não foi exercitada online. Seu comportamento no schema anterior foi verificado no teste de renderização com metadados fictícios.

Evidência sanitizada: [part-document-verification.json](part-document-verification.json). **O bloqueio correto não significa upload funcional: a conclusão do fluxo online permanece pendente.**
