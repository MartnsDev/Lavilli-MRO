# Apresentação Lavilli Control — 10 a 15 minutos

## Preparar

Iniciar Supabase local e executar `npm run test:full` para gerar build verificado. Depois `npm run demo:prepare` (stack local próprio, API 54331/banco 54332) e `npm run demo:local`. Abre servidor em http://localhost:3200 e cria registros DEMO-* novos por APIs reais locais; não lê `.env.local`. Credenciais temporárias ficam em `.local-secrets/demo-access.txt` (0600, não enviar ao Git). Autorizar navegador com código e entrar com o PIN temporário, válido apenas nesta execução. Códigos expiram em 15 minutos; reiniciar gera outros. `npm run demo:verify` valida login real por interface, captura desktop/mobile e renova os códigos locais sem imprimi-los. O banner identifica dados fictícios e e-mail fica desativado. Ctrl+C encerra o servidor. Reexecução reutiliza o último conjunto DEMO e preserva suas operações. Para outro cenário fictício independente, usar `npm run demo:local -- --new-data`, sem apagar o anterior.

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
