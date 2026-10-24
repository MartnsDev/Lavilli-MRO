# Sistema visual Lavilli Control

Fonte de verdade: `src/app/globals.css`, `src/components/ui/` e ativos de marca em public/. Montserrat local, logotipo oficial e paleta azul-marinho/ocre da Lavilli Jet.

| Token              | Claro   | Escuro                        |
| ------------------ | ------- | ----------------------------- |
| Fundo              | #f3f5f8 | #0d1522                       |
| Superfície         | #ffffff | #152133                       |
| Texto              | #17263b | #e8eef7                       |
| Secundário         | #63718a | #a2b2c8                       |
| Azul de ação       | #125572 | combinar com texto/foco claro |
| Ocre de marca/foco | #e2b476 | #e2b476                       |

Escala de espaçamento: 4/8/12/16/24/32px. Texto de controles mobile >=16px; texto informativo compacto só quando legível e com contraste. Controles interativos principais >=44px. Layout desktop com sidebar 252px (220px tablet largo), drawer até760px; containers flex/grid min-width:0. Tabelas extensas mantêm rolagem local, sem esconder colunas essenciais por CSS.

Estados de negócio devem ter texto além da cor: disponível, em uso, quarentena, pendente, crítico e concluído administrativamente. Não chamar registro administrativo de assinatura técnica. Erros ao lado do fluxo, operação só concluída após resposta persistida. Modais Radix com título/descrição, Escape e foco de retorno; origem do foco preservada inclusive quando botão está fora do Root.

Usar data-theme e ThemeToggle existentes; evitar cores claras fixas em componentes novos. Foco azul no claro/ocre no escuro, reduced-motion e touch targets. Banner de demo usa ocre suave nos dois temas e deve aparecer em todas as páginas protegidas de APP_MODE demo/test. Evitar novos padrões visuais por módulo.

Contraste calculado dos tokens em 24/10/2026: texto secundário no branco 4,93:1 e no fundo claro 4,51:1; secundário escuro 7,51:1; ação clara 8,18:1 e escura 8,86:1; sidebar 9,29:1. Estados crítico/atenção/sucesso: 6,30–8,41:1 nas combinações implementadas. Todas essas combinações superam 4,5:1; não equivale a auditar cada sobreposição, imagem ou estado da aplicação.
