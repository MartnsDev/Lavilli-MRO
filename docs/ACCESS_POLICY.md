# Acesso atual — instrução direta do proprietário

A instrução mais recente substitui a autorização inicial por código e a elevação por código independente dos relatórios anteriores.

- A página inicial pede somente o mecânico e a senha geral definida pelo proprietário.
- César e Maranhão usam a mesma senha; o valor não é versionado.
- Não há código administrativo, código de aparelho, e-mail de autorização ou cadastro prévio de navegador.
- Depois de entrar, o dashboard e sua administração ficam disponíveis. Alterações operacionais continuam confirmadas com a mesma senha e responsável declarado.
- Cookies de sessão são opacos, assinados e HttpOnly. O vínculo interno da sessão é criado automaticamente após verificar a senha, sem qualquer etapa para o usuário.
- Logout, limitação persistente, CSRF e expiração continuam ativos. A senha é verificada por Argon2id no servidor.

## Compatibilidade com o banco existente

O aplicativo identifica as colunas disponíveis consultando zero linhas. Na versão anterior do banco, usa tabelas e funções já existentes; não aplica migrations automaticamente. A sessão anterior usa expiração deslizante de 30 minutos, máximo de oito horas e vínculo com a versão do hash da senha. Falhas de rede/permissão não ativam fallback de versão.

As proteções da migration 009 seguem disponíveis no backend local que já a possui; não foi aplicada no banco real nesta correção. Relatórios anteriores que descrevem um fator independente são históricos e não certificam a política atual de senha compartilhada. Um PIN curto passou a ser o único fator humano por decisão explícita do proprietário; não equivale a autenticação multifator.

A tentativa de exportar um backup do banco real foi rejeitada pela revisão automática por falta de autorização inequívoca para esse destino. A cópia não foi executada, nenhuma migração remota foi necessária e os cadastros não foram exportados para corrigir o acesso.

## Evidências da correção

Login em navegador novo, entrada no dashboard e saída verificados com César e Maranhão na porta 3000, com o banco atual. Testes locais verificam login sem inscrição, rejeição de senha incorreta, endpoint antigo de inscrição desativado e navegação desktop/mobile. O fluxo da demo segue o mesmo acesso simples. Publicação em produção continua sem autorização.
