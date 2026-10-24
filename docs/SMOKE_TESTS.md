# Smoke tests antes da apresentação

Executar somente em demo/homologação isolada. Não usar dados reais ou e-mail real.

1. Aparelho novo não entra apenas com PIN; código independente funciona uma vez, expirado/reutilizado falha. Após autorização, nome + PIN abre dashboard.
2. César cria localização, catálogo, lote pendente; recebe quantidade, verifica condição/documentação e movimenta para destino. Recarregar confirma persistência e histórico.
3. Maranhão retira ferramenta; segunda retirada falha. Devolver deixa em quarentena. Inspecionar/liberar explicitamente. Ferramenta vencida não pode sair.
4. Abrir OS e tarefa, comentar, avançar status e concluir administrativamente; dependências impedem conclusão inválida.
5. Reservar saldo; impedir reserva superior ao disponível. Remeter material externo, devolver parcialmente para recebimento e validar saldo/remanescente.
6. Importar CSV válido, mapear colunas, confirmar e conferir histórico/original; CSV inválido mostra erros sem persistir. Repetir com XLSX em testes automatizados.
7. Enviar PDF fictício: pending bloqueia leitura. Após scanner real, clean permite proxy autenticado sem URL pública. Revogar sessão bloqueia novo download. Não simular clean na produção.
8. Ler etiqueta/QR e abrir destino; testar permissão de câmera no dispositivo de apresentação ou usar entrada manual.
9. Elevar administração, exportar CSV e conferir auditoria. PIN sozinho não eleva. Célula iniciada por fórmula deve ser neutralizada.
10. Abrir alertas e histórico; e-mail deve aparecer como não configurado/desativado, nunca como enviado.
11. Claro/escuro, 320px, tablet, 1366x768, desktop: abrir menus/modais, percorrer teclado, Escape e foco de retorno; tabelas rolam localmente.
12. Logout e revogação impedem reuso dos cookies. Confirmar ausência de erros JS, 500, dados de demonstração no backend real e segredos em bundles.

Automação: npm test; npm run test:db:docker; npm run test:full. A suíte cria apenas dados locais e exige FULL_VERIFICATION=local-only. Executar antes da apresentação e registrar contagem/commit, não prometer ausência absoluta de bugs.
