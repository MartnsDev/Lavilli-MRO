import { SecurityControls } from "@/components/security-controls";
import { resources } from "@/lib/domain/resources";
export default function Reports() {
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">DADOS PERSISTIDOS</span>
        <h1>Relatórios e exportações</h1>
        <p>
          Controle operacional interno. Exportações autenticadas, até 1.000
          registros por página de relatório.
        </p>
      </div>
      <SecurityControls />
      <form action="/api/reports" className="card stack">
        <label>
          Relatório
          <select name="entity">
            {[
              "stock_lots",
              "stock_movements",
              "physical_count_items",
              "tools",
              "tool_checkouts",
              "tool_calibrations",
              "aircraft",
              "maintenance_tasks",
              "work_orders",
              "external_shipments",
              "audit_events",
              "alerts",
            ].map((k) => (
              <option key={k} value={k}>
                {resources[k].title}
              </option>
            ))}
          </select>
        </label>
        <div className="link-grid">
          <label>
            De (data de criação)
            <input type="date" name="from" />
          </label>
          <label>
            Até
            <input type="date" name="to" />
          </label>
          <label>
            Página (1.000 registros)
            <input
              type="number"
              name="page"
              defaultValue={1}
              min={1}
              max={10000}
            />
          </label>
        </div>
        <label>
          Situação (código do estado, opcional)
          <input name="status" maxLength={40} />
        </label>
        <label>
          Formato
          <select name="format">
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </label>
        <button className="button primary">Gerar relatório</button>
        <p className="fine-print">
          CSV neutraliza fórmulas. PDF inclui horário de geração, filtros e
          identificação de controle operacional interno.
        </p>
      </form>
    </>
  );
}
