# Identidade visual Lavilli Jet

Material institucional fornecido pelo proprietário e obtido do domínio oficial `voelavillijet.com.br`. Os arquivos são servidos localmente por `public/brand`, sem chamadas ao site externo para compor as telas. Não foram recoloridos nem modificados os arquivos originais dos logotipos ou fotografias.

## Aplicação

- Logotipo ocre oficial no acesso, configuração e menu lateral. O fundo branco preserva o contraste da tipografia azul no tema escuro.
- Logotipo azul oficial no cartão de contatos da ajuda; favicon original da empresa.
- Azul profundo e dourado em detalhes, mantendo contraste de formulários/tabelas e persistência de tema.
- Foto da fachada com o símbolo dourado no acesso; foto interna no painel; fotos frontal e de aeronave na ajuda.
- Endereço, telefones, WhatsApp 24h, e-mail institucional, mapa de cabeceira e links externos de Cookies/Privacidade conforme material informado pelo proprietário.

Os contatos institucionais **não** configuram automaticamente destinatários de alertas, e-mail autorizado de novos dispositivos nem remetente transacional. Nenhuma credencial, política de acesso, PIN ou configuração Supabase foi alterada por esta atualização.

As imagens são institucionais; não representam presença atual de aeronaves, situação operacional ou evidência de manutenção. As políticas externas são identificadas como pertencentes ao site institucional, sem afirmar que substituem políticas específicas da aplicação.

## Origem dos arquivos

| Arquivo local         | Fonte original                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `logo-ochre.png`      | https://voelavillijet.com.br/wp-content/uploads/2023/02/05-lavillijet-ocre.png                                                 |
| `logo-blue.png`       | https://voelavillijet.com.br/wp-content/uploads/2023/02/03-lavillijet-azul.png                                                 |
| `logo-primary.png`    | https://voelavillijet.com.br/wp-content/uploads/elementor/thumbs/logo-lavilli-1-q2li0wxqlbxuvtqxzw7scv6uw0hl8gkuid1435o910.png |
| `favicon.png`         | https://voelavillijet.com.br/wp-content/uploads/2023/02/favicon.png                                                            |
| `hangar-interior.jpg` | https://voelavillijet.com.br/wp-content/uploads/2023/02/Hangar-01.jpg                                                          |
| `hangar-aircraft.jpg` | https://voelavillijet.com.br/wp-content/uploads/2023/02/Hangar-02.jpg                                                          |
| `hangar-front.jpg`    | https://voelavillijet.com.br/wp-content/uploads/2023/02/Hangar-04.jpg                                                          |
| `hangar-sign.jpg`     | https://voelavillijet.com.br/wp-content/uploads/2023/02/Hangar-06.jpg                                                          |
| `hangar-contact.jpg`  | https://voelavillijet.com.br/wp-content/uploads/2023/03/fale-conosco-atendimento.jpg                                           |

`src/lib/company.ts` centraliza contatos públicos; `BrandLogo` mantém o logotipo consistente e `CompanyContact` apresenta as referências institucionais na ajuda.

## Validação desta atualização

Lint, TypeScript, formatação, verificação de padrões de segredos e build passaram. Os 12 testes HTTP passaram contra a build de produção local na porta 3002. As sete imagens utilizadas nas telas responderam 200 com tipo de imagem; login e configuração incluíram o logotipo oficial. Os dois links institucionais de políticas responderam 200. Não houve navegador conectado para revisão visual ou captura de tela; testes visuais desktop/mobile continuam pendentes.

## Segunda revisão — referência direta do site

O acesso passou a usar o mesmo logotipo `logo-lavilli-1.png` do cabeçalho institucional, Montserrat Regular/Bold originais e os tokens de cor do CSS oficial: #051C2C, #125572 e #E2B476. O logotipo fica sobre o próprio cabeçalho claro, sem moldura destacada. A composição usa foto interna ampla, tipografia de destaque e botões dourados retangulares. Fonte, licença OFL e imagens ficam locais. Fontes consultadas: `https://voelavillijet.com.br/wp-content/uploads/elementor/css/post-4.css`, `post-9.css` e arquivos de fontes do domínio oficial.

Novos arquivos: `logo-official.png`, `Montserrat-Regular.woff2`, `Montserrat-Bold.woff2`, `OFL-Montserrat.txt`. Os testes de Chrome temporário validaram desktop/mobile, logo carregado, tema persistente e o estado de primeiro acesso; capturas foram revisadas visualmente.
