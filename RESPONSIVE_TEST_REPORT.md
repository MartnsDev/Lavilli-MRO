# Relatório de responsividade

24/10/2026. Projeto Playwright `visual` em `playwright.full.config.ts`; teste em `tests/full/visual.spec.ts`.

Matriz obrigatória: 320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1366, 1440 e 1920px. Tema claro e escuro; 1366x768; paisagem 768x430; modal 320x640; teclado/Escape/foco e erros JavaScript. Capturas selecionadas em 320/768/1366. Todas as coleções e rotas principais recebem medição scrollWidth/clientWidth; tabelas podem rolar dentro de seu container.

Baseline: rota/formulário de localizações revelou falha de foco após Escape. Corrigido em DialogContent e acrescido teste de regressão. Menu móvel também recebeu controle de teclado e isolamento pelo modal Radix.

Resultado final: 176 casos integrados aprovados, seguidos de seis regressões aprovadas no build final (cinco repetidas e uma nova de inatividade). Matriz final com 1.104 medições, zero overflow da página e zero erros coletados de execução/console/HTTP 5xx. Eventos de rede abortados por navegação são registrados separadamente, sem tratá-los como falha de servidor. Capturas em test-results/visual/after, matriz JSON e resumo versionado em docs/verification-results.json.

Reflow de 200% foi emulado em 683x384 CSS pixels, equivalente ao espaço de layout de 1366x768 com zoom de 200%; não se usou CSS zoom como substituto do zoom nativo. O primeiro teste com CSS zoom misturava duas medições distintas; foi corrigido e reexecutado. Zoom nativo no equipamento real e leitura de câmera continuam no smoke manual, sem declaração de homologação física.

O retorno de foco do modal e a contenção/retorno do drawer foram exercitados com Tab, Shift+Tab e Escape. Drawer usa o modal Radix existente. Inatividade em aba visível foi verificada com relógio acelerado: logout, remoção do cookie e negação de API protegida.

Contrastes dos tokens principais foram calculados (mínimo observado 4,51:1 nas combinações medidas). Não foi executada certificação completa WCAG, teste com todos os leitores de tela nem contraste de cada pixel/overlay.
