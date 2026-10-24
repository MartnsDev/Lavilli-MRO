# Auditoria visual

24/10/2026. Refinamento incremental preservando marca, autenticação, Supabase e regras de negócio. Referências oficiais e ativos existentes Lavilli Jet mantidos: logo original, Montserrat local e fotografias locais em alta resolução. Nenhuma logo artificial foi criada.

## Alterações implementadas

- Formulários/modais: largura limitada à viewport, rolagem interna, campos sem estouro, tipografia de 16px em mobile e resumo de confirmação com quebra de texto.
- Foco: correção real encontrada no teste de teclado; fechar modal devolve foco ao botão de abertura.
- Navegação móvel: menu fechado invisível/inacessível ao foco, Escape, contenção de Tab, fundo protegido pelo modal Radix, bloqueio de rolagem e retorno de foco. Estado expandido e página atual expostos a tecnologia assistiva.
- Botões/menu/fechar modal: altura mínima 44px; foco visível nos dois temas; redução de movimento respeitada.
- Layout: min-width:0 nos containers, busca fluida, títulos longos quebram, banner de dados fictícios responsivo.
- Documentos: estado pendente/rejeitado informativo e download disponível somente após liberação, sem link que retorna erro para um arquivo ainda bloqueado. Verificado em 320px, Chrome e Firefox.
- Claro/escuro: cores específicas do banner, foco contrastante, fundos/bordas e marca preservados.

## Escopo de revisão

Dashboard, árvore de localizações, busca, leitura QR, importações, relatórios, configurações, ajuda, todas as 34 coleções e detalhes de localização/ferramenta/aeronave/catálogo. Formulários e fluxos por navegador nas suítes desktop/mobile/Firefox. Login tem testes públicos próprios. Nem todos os estados de erro, todos os dados possíveis ou cada tecnologia assistiva foram inspecionados manualmente.

Capturas antes/depois: `test-results/visual/before/` e `test-results/visual/after/`, ignoradas pelo Git por conterem dados de ensaio. A primeira rodada de baseline encontrou falha de retorno do foco; não foi tratada como aprovação. Evidências finais no relatório de responsividade. Revisão visual por screenshot não é certificação WCAG completa.
