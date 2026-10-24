import { session } from "@/lib/server/auth";
import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  Wrench,
  Package,
  AlertTriangle,
  Plane,
  Clock,
  Plus,
  Activity,
} from "lucide-react";
import { db } from "@/lib/server/db";
import { dateBR, dayKeySP } from "@/lib/utils";
export default async function Dashboard() {
  await session();
  const client = db();
  const soon = dayKeySP(new Date(new Date().getTime() + 30 * 86400000));
  const results = await Promise.all([
    client
      .from("maintenance_tasks")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(administratively_complete,cancelled)")
      .is("archived_at", null),
    client
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(administratively_complete,cancelled)")
      .is("archived_at", null),
    client
      .from("tools")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_use"),
    client
      .from("stock_lots")
      .select("id", { count: "exact", head: true })
      .eq("condition", "quarantine"),
    client
      .from("tools")
      .select("id", { count: "exact", head: true })
      .eq("calibration_required", true)
      .neq("status", "retired")
      .or(`calibration_due.is.null,calibration_due.lte.${soon}`),
    client
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("severity", "critical")
      .neq("status", "resolved"),
    client
      .from("maintenance_tasks")
      .select("id,name,status,due_at,priority")
      .not("status", "in", "(administratively_complete,cancelled)")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(6),
    client
      .from("audit_events")
      .select("id,entity,entity_id,reason,action,created_at,mechanics(name)")
      .order("created_at", { ascending: false })
      .limit(7),
    client
      .from("alerts")
      .select("id,name,severity")
      .neq("status", "resolved")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  for (const r of results) if (r.error) throw r.error;
  const cards = [
    {
      title: "Tarefas abertas",
      value: results[0].count,
      icon: ClipboardList,
      href: "/records/maintenance_tasks",
      note: "Acompanhamento do trabalho",
    },
    {
      title: "Ordens de serviço",
      value: results[1].count,
      icon: Plane,
      href: "/records/work_orders",
      note: "Em acompanhamento",
    },
    {
      title: "Ferramentas em uso",
      value: results[2].count,
      icon: Wrench,
      href: "/records/tool_checkouts",
      note: "Retorno a acompanhar",
    },
    {
      title: "Lotes em quarentena",
      value: results[3].count,
      icon: Package,
      href: "/records/stock_lots",
      note: "Indisponíveis para consumo",
    },
    {
      title: "Calibrações",
      value: results[4].count,
      icon: Clock,
      href: "/records/tools",
      note: "Vencidas ou em até 30 dias",
    },
    {
      title: "Alertas críticos",
      value: results[5].count,
      icon: AlertTriangle,
      href: "/records/alerts",
      note: "Pendências registradas",
    },
  ];
  return (
    <>
      <div className="page-heading heading-actions">
        <div>
          <span className="eyebrow">LAVILLI JET / OPERAÇÃO</span>
          <h1>Visão geral do hangar</h1>
          <p>O que precisa de atenção para organizar o trabalho de hoje.</p>
        </div>
        <span className="date-chip">
          {new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "long",
            timeZone: "America/Sao_Paulo",
          }).format(new Date())}
        </span>
      </div>
      <section className="welcome-band">
        <div>
          <span className="eyebrow">CONTROLE, DO RECEBIMENTO AO DESTINO</span>
          <h2>
            Cada item em seu lugar.
            <br />
            Cada movimento registrado.
          </h2>
          <p>Peças, ferramentas e serviços conectados à rotina do hangar.</p>
          <Link className="button band-button" href="/records/stock_lots">
            Movimentar material <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="hangar-art" aria-hidden="true">
          <div className="art-ring" />
          <Plane size={130} strokeWidth={0.8} />
          <span>LAVILLI JET</span>
          <div className="art-coordinate">GESTÃO OPERACIONAL · HANGAR</div>
        </div>
      </section>
      <div className="section-heading">
        <h2>Em acompanhamento</h2>
        <span className="fine-print">
          <span className="live-dot" /> Consultas ao banco · atualização a cada
          minuto
        </span>
      </div>
      <div className="metrics-grid">
        {cards.map((c) => (
          <Link href={c.href} className="metric-card" key={c.title}>
            <div className="metric-top">
              <span>{c.title}</span>
              <c.icon size={19} />
            </div>
            <strong>{c.value ?? 0}</strong>
            <small>{c.note}</small>
          </Link>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="card">
          <div className="section-heading">
            <h2>
              <ClipboardList size={19} /> Próximas tarefas
            </h2>
            <Link href="/records/maintenance_tasks">
              Ver todas <ArrowUpRight size={15} />
            </Link>
          </div>
          {results[6].data?.length ? (
            <ul className="task-list">
              {results[6].data.map((t) => (
                <li key={t.id}>
                  <span
                    className={
                      t.due_at &&
                      new Date(t.due_at).getTime() < new Date().getTime()
                        ? "task-dot overdue"
                        : "task-dot"
                    }
                  />
                  <div>
                    <Link href={`/records/maintenance_tasks/${t.id}`}>
                      {t.name}
                    </Link>
                    <small>
                      {t.due_at ? dateBR(t.due_at) : "Sem prazo informado"}
                    </small>
                  </div>
                  <span className="badge">
                    {t.priority === "critical"
                      ? "Crítica"
                      : t.priority === "high"
                        ? "Alta"
                        : "Normal"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="compact-empty">
              <ClipboardList size={30} />
              <h3>Nenhuma tarefa aberta</h3>
              <p>
                Cadastre uma tarefa rápida para organizar a próxima atividade.
              </p>
              <Link href="/records/maintenance_tasks">Abrir tarefas →</Link>
            </div>
          )}
        </section>
        <section className="card">
          <div className="section-heading">
            <h2>
              <AlertTriangle size={19} /> Atenção na operação
            </h2>
            <Link href="/records/alerts">
              Central <ArrowUpRight size={15} />
            </Link>
          </div>
          {results[8].data?.length ? (
            <ul className="alert-list">
              {results[8].data.map((a) => (
                <li key={a.id}>
                  <AlertTriangle size={17} />
                  <Link href={`/records/alerts/${a.id}`}>{a.name}</Link>
                  <span className="badge">
                    {a.severity === "critical" ? "Crítico" : "Atenção"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="compact-empty">
              <AlertTriangle size={30} />
              <h3>Nenhum alerta pendente</h3>
              <p>
                Os alertas refletem os registros processados pelo job
                configurado.
              </p>
            </div>
          )}
        </section>
        <section className="card">
          <div className="section-heading">
            <h2>
              <Activity size={19} /> Atividades recentes
            </h2>
            <Link href="/records/audit_events">
              Histórico <ArrowUpRight size={15} />
            </Link>
          </div>
          {results[7].data?.length ? (
            <ol className="timeline">
              {results[7].data.map((a) => (
                <li key={a.id}>
                  <span className="timeline-dot" />
                  <strong>
                    {(a.mechanics as unknown as { name: string } | null)
                      ?.name ?? "Sistema"}
                  </strong>
                  <p>{a.reason ?? a.action}</p>
                  <time>{dateBR(a.created_at)}</time>
                </li>
              ))}
            </ol>
          ) : (
            <div className="compact-empty">
              <Activity size={30} />
              <h3>O histórico começa aqui</h3>
              <p>
                As primeiras alterações aparecerão após confirmação do
                responsável.
              </p>
            </div>
          )}
        </section>
        <section className="card">
          <div className="section-heading">
            <h2>
              <Plus size={19} /> Acesso rápido
            </h2>
          </div>
          <div className="quick-links">
            {[
              ["Retirar ferramenta", "/records/tools"],
              ["Cadastrar peça", "/records/part_catalog"],
              ["Abrir tarefa", "/records/maintenance_tasks"],
              ["Abrir ordem de serviço", "/records/work_orders"],
              ["Receber material", "/records/stock_lots"],
              ["Conferir inventário", "/records/physical_counts"],
            ].map(([title, href]) => (
              <Link key={href} href={href}>
                {title}
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
