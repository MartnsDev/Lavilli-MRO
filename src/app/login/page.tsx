import Image from "next/image";
import { ArrowUpRight, MapPin } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { company } from "@/lib/company";
import { accessState } from "@/lib/server/access-state";
export const dynamic = "force-dynamic";
export default async function Login() {
  const state = await accessState();
  return (
    <main className="access-stage">
      <header className="access-masthead">
        <div className="access-masthead-inner">
          <BrandLogo className="access-wordmark" />
          <span className="access-product-name">GESTÃO DO HANGAR</span>
          <div className="access-header-actions">
            <a href={company.website} target="_blank" rel="noopener noreferrer">
              Conheça a Lavilli <ArrowUpRight size={14} />
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="access-scene">
        <section
          className="access-story"
          aria-label="Hangar Lavilli Jet em Jundiaí"
        >
          <Image
            src="/brand/hangar-hd.jpg"
            alt="Fachada e aeronaves no hangar Lavilli Jet em Jundiaí"
            fill
            preload
            unoptimized
            style={{ objectPosition: "left center" }}
            sizes="(max-width: 900px) 100vw, 57vw"
            className="access-story-photo"
          />
          <div className="access-story-overlay" />
          <div className="access-story-top">
            <span className="access-story-rule" /> AVIAÇÃO EXECUTIVA · JUNDIAÍ
          </div>
          <div className="access-story-content">
            <span className="access-story-kicker">
              A EXCELÊNCIA ESTÁ NOS DETALHES.
            </span>
            <h2>
              Seu hangar.
              <br />
              <span>Sob controle.</span>
            </h2>
            <p>
              Peças, ferramentas e serviços conectados.
              <br />
              Mais clareza para cuidar de cada etapa.
            </p>
            <div className="access-story-categories">
              <span>Organização</span>
              <span>Rastreabilidade</span>
              <span>Cuidado</span>
            </div>
          </div>
          <div className="access-story-footer">
            <span>
              <MapPin size={13} /> Jundiaí, São Paulo
            </span>
            <span>LAVILLI JET</span>
          </div>
        </section>
        <section className="access-gate" aria-label="Entrada do sistema">
          <div className="access-gate-line" />
          <LoginForm initialState={state} />
          <p className="access-operational-note">
            Controle operacional interno.
            <br />
            Registros e conclusões não substituem assinatura técnica oficial.
          </p>
        </section>
      </div>
      <footer className="access-page-footer">
        <span>
          Lavilli Jet <span className="footer-separator">/</span> Gestão do
          Hangar
        </span>
        <span>Organização em solo. Atenção em cada detalhe.</span>
      </footer>
    </main>
  );
}
