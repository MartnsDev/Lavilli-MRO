import Image from "next/image";
import { ShieldCheck, MapPin, ArrowUpRight } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { company } from "@/lib/company";

export default function Login() {
  return (
    <main className="auth-page branded-access">
      <header className="auth-top">
        <BrandLogo />
        <ThemeToggle />
      </header>
      <div className="auth-layout">
        <section
          className="auth-visual"
          aria-label="Hangar Lavilli Jet em Jundiaí"
        >
          <Image
            src="/brand/hangar-sign.jpg"
            alt="Fachada azul do hangar Lavilli Jet com o símbolo dourado da marca"
            fill
            sizes="(max-width: 899px) 1px, (max-width: 1440px) 52vw, 650px"
            className="auth-photo"
          />
          <div className="auth-visual-shade" />
          <div className="auth-visual-content">
            <span className="eyebrow">LAVILLI JET · GESTÃO DO HANGAR</span>
            <h2>
              A operação começa
              <br />
              com organização.
            </h2>
            <p>
              Peças, ferramentas e serviços.
              <br />
              Uma rotina conectada ao seu hangar.
            </p>
            <span className="auth-location">
              <MapPin size={15} /> Jundiaí · São Paulo
            </span>
          </div>
        </section>
        <section className="login-card">
          <span className="auth-icon">
            <ShieldCheck size={26} />
          </span>
          <span className="eyebrow">ACESSO RESTRITO À OPERAÇÃO</span>
          <h1>Acesso à operação</h1>
          <p>
            Entre em um dispositivo autorizado usando a senha geral do hangar.
          </p>
          <LoginForm />
          <p className="fine-print">
            Responsáveis são informados em cada alteração. Os registros não
            representam assinatura técnica oficial.
          </p>
          <a
            className="institutional-link"
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Site institucional <ArrowUpRight size={14} />
          </a>
        </section>
      </div>
      <p className="access-footer">
        Lavilli Jet · Gestão do Hangar <span>Controle operacional interno</span>
      </p>
    </main>
  );
}
