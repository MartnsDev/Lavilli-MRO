"use client";
import Link from "next/link";
import { Dialog as NavigationDialog } from "radix-ui";
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
  X,
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
export function Shell({
  children,
  demo = false,
}: {
  children: React.ReactNode;
  demo?: boolean;
}) {
  const path = usePathname(),
    router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function resize() {
      if (window.innerWidth > 760) setOpen(false);
    }
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    let lastInteraction = Date.now();
    let leaving = false;
    const active = () => {
      lastInteraction = Date.now();
    };
    for (const event of ["pointerdown", "keydown", "touchstart", "scroll"])
      document.addEventListener(event, active, {
        passive: true,
        capture: true,
      });
    const id = setInterval(async () => {
      if (leaving) return;
      if (Date.now() - lastInteraction >= 30 * 60000) {
        leaving = true;
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            signal: AbortSignal.timeout(5000),
          });
        } catch {
          /* Server still enforces idle/max lifetime if offline. */
        }
        router.replace("/login");
        router.refresh();
        return;
      }
      if (document.visibilityState === "visible") router.refresh();
    }, 60000);
    return () => {
      clearInterval(id);
      for (const event of ["pointerdown", "keydown", "touchstart", "scroll"])
        document.removeEventListener(event, active, { capture: true });
    };
  }, [router]);
  const navigation = (
    <>
      <Link className="brand" href="/dashboard" onClick={() => setOpen(false)}>
        <BrandLogo subtitle />
      </Link>
      <div className="sidebar-label">ESPAÇO OPERACIONAL</div>
      <nav aria-label="Navegação principal">
        {nav.map((n) => (
          <Link
            key={n.href}
            aria-current={path === n.href ? "page" : undefined}
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
    </>
  );
  return (
    <NavigationDialog.Root open={open} onOpenChange={setOpen}>
      <div className="app-shell">
        <aside
          className="sidebar desktop-sidebar"
          aria-label="Menu operacional"
        >
          {navigation}
        </aside>
        <NavigationDialog.Portal>
          <NavigationDialog.Overlay className="mobile-scrim" />
          <NavigationDialog.Content
            className="sidebar mobile-open mobile-drawer"
            aria-describedby={undefined}
          >
            <NavigationDialog.Title className="sr-only">
              Menu operacional
            </NavigationDialog.Title>
            {navigation}
            <NavigationDialog.Close
              className="drawer-close"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </NavigationDialog.Close>
          </NavigationDialog.Content>
        </NavigationDialog.Portal>
        <div className="workspace">
          {demo && (
            <div className="environment-banner" role="status">
              Demonstração / teste · dados fictícios · ambiente isolado
            </div>
          )}
          <header className="topbar">
            <NavigationDialog.Trigger asChild>
              <Button
                variant="ghost"
                className="mobile-menu"
                aria-label="Abrir menu"
              >
                <Menu size={22} />
              </Button>
            </NavigationDialog.Trigger>
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
                aria-label="Sair"
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
    </NavigationDialog.Root>
  );
}
