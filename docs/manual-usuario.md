# Manual da operação

## Acesso

A administração autoriza cada aparelho uma vez com código temporário independente. Depois, selecione **César** ou **Maranhão**, informe a senha geral e clique em **Entrar no hangar**. A mesma senha funciona para ambos. Use **Sair** quando terminar. A interface solicita saída após 30 minutos sem interação; o servidor também limita atividade e duração máxima. Configurações sensíveis e exportações exigem confirmação administrativa independente por cinco minutos.

## Alterações

Todo cadastro/movimento abre formulário e, em seguida, resumo com responsável informado e campo para redigitar a senha geral. Confira antes de confirmar. Se outro dispositivo alterar o cadastro, será necessário revisar a versão atual antes de salvar. A escolha de nome é autodeclarada e não é assinatura técnica.

## Sequência de cadastro

1. Cadastre localizações (hangar, oficina, armários etc.) e use Local superior para hierarquia. Veja a árvore pelo link da lista.
2. Cadastre fornecedores, terceiros e proprietários em Empresas e proprietários.
3. Crie catálogo de peças por P/N e fabricante. Crie lotes por catálogo/local ou peças serializadas por S/N.
4. Registre entrada pelo botão Movimentar estoque. Recebimento exige conferência posterior de condição e documentação.
5. Cadastre ferramentas e, quando aplicável, suas calibrações. A referência do certificado não substitui conferência do documento.

## Materiais

Na ficha do lote, Movimentar estoque permite receber, reservar, liberar reserva, consumir reserva, consumir disponível, transferir e dar baixa. Quantidade reservada continua fisicamente presente. Não há conversão automática de unidade.

Para liberar/consumir reserva, selecione a reserva e informe sua quantidade integral. Não há consumo parcial de uma reserva nesta versão; libere e faça nova reserva quando necessário. Transferências preservam lote e condição e exigem destino distinto.

Abra inventário em Inventários, registre contagens e consulte Contagens físicas. Concilie divergência com motivo. O sistema rejeita ajuste se o saldo mudou após a contagem ou se a contagem ficar abaixo das reservas. Ajustes não apagam movimentos anteriores.

Peças serializadas podem ser transferidas, instaladas ou removidas com registro interno. Instalação informa aeronave/posição; remoção exige local e volta a condição pendente. Localização desconhecida limpa o local antigo.

## Ferramentas

Retirada exige destino, com matrícula/tarefa/OS opcionais. Ferramentas em kit são retiradas pelo kit com conferência. Na devolução, confirme guarda e estado. O retorno deixa a ferramenta em quarentena; confira e libere explicitamente antes de outra retirada. No kit, desmarque itens não encontrados: eles ficam desaparecidos e geram ocorrência. Reconhecer alerta não resolve a ocorrência nem libera automaticamente a ferramenta.

Ferramentas calibráveis sem vencimento informado ou com vencimento passado não podem ser retiradas. Registro de calibração retorna ferramenta à quarentena ou danificada; disponibilidade exige confirmação explícita após conferência.

## Serviços e remessas

Tarefas podem existir sem OS ou matrícula. Para associar posteriormente, edite a tarefa e escolha a OS; a identidade/histórico permanecem. Alterar andamento permite encerramento administrativo. OS com tarefas abertas não encerra. Isso não representa liberação de aeronave.

Em Materiais externos, crie remessa, adicione materiais e confirme despacho. Itens de remessas permite retorno parcial. Todo material retornado entra pendente de verificação, sem condição aprovada automática. Acompanhe rastreio por eventos informados.

## Documentos, pesquisa e relatórios

Cadastre documento, referência HTTPS e categoria. Na ficha, envie versões PDF/PNG/JPEG de até 4 MB. A versão anterior permanece. Novas versões ficam pendentes até scanner com assinaturas atualizadas; enquanto pendentes, não podem ser baixadas. Arquivos liberados passam pelo proxy com sessão válida, sem URL pública. Vínculos de documentos usa o UUID da ficha de destino.

A busca global encontra campos textuais diretos; listas têm busca/paginação. Alguns filtros cruzados e número de OS ainda não são pesquisáveis. Após elevação administrativa, relatórios exportam CSV/PDF com dados persistidos, por data/situação e páginas de 1.000 registros.

Importações aceitam CSV/XLSX de até 100 linhas. Baixe modelo, mapeie colunas, corrija erros e confirme. Referências usam UUIDs. A versão atual cria ou ignora duplicados; não atualiza registros existentes silenciosamente. O arquivo original é preservado privadamente e associado ao histórico. Confirmações JSON limitadas a 64 KiB: divida lotes maiores se receber aviso de tamanho. Consulte erros no histórico de importações.

O tema claro/escuro fica salvo no dispositivo. As páginas atualizam a cada minuto enquanto visíveis e a sessão não está inativa. Sem conexão, aguarde o retorno da rede antes de alterar dados.

## Leitura de etiquetas

Abra Ler etiqueta / QR no menu e autorize a câmera somente quando necessário. Em navegador com BarcodeDetector e HTTPS, o QR abre a ficha autenticada da mesma origem. As imagens não são armazenadas. Em aparelhos sem suporte ou com permissão negada, informe o código patrimonial, P/N ou S/N no campo manual. Não use a leitura como conferência técnica de condição.
