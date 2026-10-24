import Link from "next/link";
export default function Help() {
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">APOIO À OPERAÇÃO</span>
        <h1>Ajuda e boas práticas</h1>
        <p>Controle físico, histórico claro e responsabilidade informada.</p>
      </div>
      <div className="card prose">
        <h2>Comece pela organização física</h2>
        <p>
          Cadastre localizações, fornecedores e proprietários. Em seguida,
          cadastre o catálogo de peças, seus lotes e ferramentas. Todo
          recebimento entra pendente até conferência explícita de condição e
          documentação.
        </p>
        <h2>Como confirmar alterações</h2>
        <p>
          Revise o resumo, escolha o responsável informado e redigite a senha
          geral. A confirmação vale por dois minutos e é vinculada à operação;
          cada alteração produz histórico no servidor.
        </p>
        <h2>Ferramentas e materiais</h2>
        <p>
          Reservas não são saídas físicas. Ferramentas com calibração pendente
          ou vencida não podem ser retiradas. Kits exigem conferência; itens
          faltantes no retorno geram ocorrências.
        </p>
        <h2>Limites técnicos</h2>
        <p>
          Concluir uma tarefa ou OS representa encerramento administrativo. Este
          sistema não emite autorização de voo, assinatura técnica autenticada
          nem documentos oficiais de manutenção. Condições são registros
          informados, sujeitos aos procedimentos da organização.
        </p>
        <h2>Atualização entre dispositivos</h2>
        <p>
          As páginas se atualizam a cada minuto enquanto visíveis. Não são
          permitidas alterações offline. Reabra o registro antes de uma operação
          crítica.
        </p>
        <Link href="/settings">Abrir configurações</Link>
      </div>
    </>
  );
}
