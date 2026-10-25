# Apresentação Lavilli Control — 10 a 15 minutos

## Preparar

Iniciar Supabase local e executar `npm run test:full` para gerar build verificado. Depois `npm run demo:prepare` (stack local próprio, API 54331/banco 54332) e `npm run demo:local`. Abre servidor em http://localhost:3200 e cria registros DEMO-* novos por APIs reais locais; não lê `.env.local`. O PIN da demonstração é persistido privadamente em `.local-secrets/demo-pin.txt` e permanece entre reinícios. Configuração privada do acesso fica em `.local-secrets/demo-access.txt` (0600, não enviar ao Git). Selecionar o mecânico e entrar com o PIN configurado pelo proprietário, preservado entre reinícios. Não há código de aparelho ou código administrativo. `npm run demo:verify` valida login real por interface, captura desktop/mobile sem imprimir a senha. O banner identifica dados fictícios e e-mail fica desativado. Ctrl+C encerra o servidor. Reexecução reutiliza o último conjunto DEMO e preserva suas operações. Para outro cenário fictício independente, usar `npm run demo:local -- --new-data`, sem apagar o anterior.

A demonstração usa o Supabase local lavilli-control-demo, separado do lavilli-jet dos testes. Buscar o prefixo DEMO informado no arquivo privado. O build é copiado para .next-demo para permanecer independente de novas execuções dos testes. Para limpeza, usar somente instância descartável explicitamente identificada; nenhum script desta preparação apaga dados remotos.

## Pitch de 60 segundos

“O Lavilli Control organiza o fluxo do hangar: onde está o material, quem declarou cada operação, o que está reservado, emprestado ou aguardando conferência. César e Maranhão trabalham no mesmo painel, com confirmação das alterações e histórico. Peças, ferramentas, tarefas e documentos permanecem conectados. Os registros apoiam a gestão operacional; a conclusão administrativa no sistema não substitui assinatura técnica nem autoriza retorno ao serviço. Hoje mostramos dados fictícios em ambiente separado.”

## Roteiro

| Tempo         | Cena                                                          | Resultado verificável                                                      |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 0–2 min       | Login como César e dashboard                                  | Ambiente fictício identificado, indicadores e navegação                    |
| 2–4 min — A   | Catálogo/lote DEMO, recebimento, verificação, movimentação    | Local e saldo persistem, histórico declara César                           |
| 4–6 min — B   | Sair/entrar como Maranhão, retirar torquímetro                | Item em uso; retorno em quarentena, inspeção antes de disponibilidade      |
| 6–8 min — C   | OS/tarefa DEMO, comentário e avanço                           | Relação com aeronave e conclusão administrativa                            |
| 8–10 min — D  | Reserva, remessa e retorno parcial                            | Impede saldo insuficiente e recebe em área de conferência                  |
| 10–12 min — E | CSV válido/inválido em docs/demo; PDF privado; QR; exportação | Validação, confirmação, histórico e privacidade; explicar scanner pendente |
| 12–14 min — F | Alertas e histórico                                           | Alertas internos reais; e-mail desativado explicitamente                   |
| 14–15 min     | Limites e próximos passos                                     | Homologação na nuvem, scanner, backup e aprovação antes de produção        |

PDF recém-enviado permanece bloqueado até scanner operacional. Não clicar como se estivesse liberado; mostrar o estado de proteção e explicar a dependência. Os testes de proxy usam parecer simulado somente no ambiente isolado e não comprovam antivírus real. E-mail externo, Preview e restauração integral são pendências declaradas.

## Plano de contingência

Executar localmente com banco e build já preparados; internet não é necessária depois das dependências e imagens locais instaladas. Manter capturas de `test-results/visual/after` para explicar telas se equipamento falhar, deixando claro que captura não comprova operação ao vivo. Não apontar fallback para produção nem exibir credenciais durante projeção.

## Câmera e documentos — percurso adicional

No celular, abrir `https://lavilli-control.vercel.app/scan` em HTTPS e entrar escolhendo César ou Maranhão, com a senha já combinada. A permissão da câmera é a solicitação normal do navegador; não há código de autorização de aparelho.

1. Ler uma etiqueta do sistema ou um código de barras. Se a câmera for negada, mostrar a leitura por foto e a busca manual.
2. Fotografar a identificação ou documento de uma peça e aguardar a leitura de PN e serial. Conferir os dois campos com o original, especialmente 0/O e 1/I; corrigir antes de continuar.
3. Usar os campos no cadastro. Um PN existente vem selecionado; para PN novo, cadastrar primeiro o catálogo e continuar com o serial preservado. Informar a localização real e manter condição/documentação pendentes até a conferência técnica.
4. Na ficha da unidade, usar **Foto e documento desta peça**: cadastrar o documento, confirmar o vínculo e selecionar **Usar foto da leitura** ou tirar outra foto. Confirmar o envio privado.
5. Abrir o documento e suas versões. Enquanto aguarda o antivírus, o arquivo permanece bloqueado. Depois de liberado, mostrar a foto verificada ou baixar pelo acesso autenticado.

Para apenas demonstrar, é possível parar após a leitura/revisão, sem confirmar cadastros no banco real. Usar o ambiente local isolado dos cenários anteriores para exemplos fictícios completos; o ambiente online separado de testes foi cancelado. Na produção, salvar somente peças/documentos reais autorizados.

Antes da apresentação, o responsável pela configuração deve confirmar que o computador do worker está ligado e `lavilli-document-scanner.service` está ativo. O serviço inicia automaticamente com a sessão deste usuário; ele depende deste computador ligado e da sessão ativa. O primeiro OCR pode demorar pelo carregamento dos modelos; ensaiar a câmera e a conexão no celular físico da equipe. Não prometer precisão total nem disponibilidade do scanner quando esse computador estiver desligado.
