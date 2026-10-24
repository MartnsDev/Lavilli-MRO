"use client";
import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Plane,
  LayoutDashboard,
  Package,
  Wrench,
  ClipboardList,
  ArrowUpRight,
  FileText,
  Bell,
  Settings,
  History,
  Search,
  Menu,
  LogOut,
  MapPin,
  Building2,
  ChartNoAxesCombined,
  Upload,
  HelpCircle,
  ScanLine,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
const nav = [
  { label: "Ler etiqueta / QR", href: "/scan", icon: ScanLine },
  { label: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Peças e componentes",
    href: "/records/part_catalog",
    icon: Package,
  },
  { label: "Estoque e lotes", href: "/records/stock_lots", icon: Package },
  { label: "Localizações", href: "/records/locations", icon: MapPin },
  { label: "Ferramentas e kits", href: "/records/tools", icon: Wrench },
  { label: "Aeronaves", href: "/records/aircraft", icon: Plane },
  { label: "Tarefas", href: "/records/maintenance_tasks", icon: ClipboardList },
  {
    label: "Ordens de serviço",
    href: "/records/work_orders",
    icon: ClipboardList,
  },
  {
    label: "Materiais externos",
    href: "/records/external_shipments",
    icon: ArrowUpRight,
  },
  {
    label: "Empresas e proprietários",
    href: "/records/organizations",
    icon: Building2,
  },
  { label: "Documentos", href: "/records/documents", icon: FileText },
  { label: "Alertas", href: "/records/alerts", icon: Bell },
  { label: "Relatórios", href: "/reports", icon: ChartNoAxesCombined },
  { label: "Importações", href: "/imports", icon: Upload },
  { label: "Histórico", href: "/records/audit_events", icon: History },
  { label: "Configurações", href: "/settings", icon: Settings },
  { label: "Ajuda", href: "/help", icon: HelpCircle },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 60000);
    return () => clearInterval(id);
  }, [router]);
  return (
    <div className="app-shell">
      <aside className={open ? "sidebar mobile-open" : "sidebar"}>
        <Link
          className="brand"
          href="/dashboard"
          onClick={() => setOpen(false)}
        >
          <BrandLogo subtitle />
        </Link>
        <div className="sidebar-label">ESPAÇO OPERACIONAL</div>
        <nav aria-label="Navegação principal">
          {nav.map((n) => (
            <Link
              key={n.href}
              className={path === n.href ? "nav-link active" : "nav-link"}
              href={n.href}
              onClick={() => setOpen(false)}
            >
              <n.icon size={18} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="live-dot" /> Controle operacional interno
        </div>
      </aside>
      {open && (
        <button
          className="mobile-scrim"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <Button
            variant="ghost"
            className="mobile-menu"
            aria-label="Abrir menu"
            onClick={() => setOpen(!open)}
          >
            <Menu size={22} />
          </Button>
          <form action="/search" className="global-search">
            <Search size={18} />
            <input
              name="q"
              placeholder="Buscar P/N, série, ferramenta, matrícula…"
              aria-label="Busca global"
              minLength={2}
            />
            <kbd>BUSCAR</kbd>
          </form>
          <div className="topbar-actions">
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={async () => {
                const r = await fetch("/api/auth/logout", { method: "POST" });
                if (r.ok) router.push("/login");
                else router.refresh();
              }}
            >
              <LogOut size={17} />
              <span>Sair</span>
            </Button>
          </div>
        </header>
        <main className="main-content">{children}</main>
        <footer>
          Lavilli Jet · Gestão do Hangar{" "}
          <span>
            Conclusões administrativas não autorizam retorno ao serviço.
          </span>
        </footer>
      </div>
    </div>
  );
}
