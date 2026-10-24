import Image from "next/image";
import { MapPin, Phone, Mail, ArrowUpRight } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { company } from "@/lib/company";

export function CompanyContact() {
  return (
    <section
      className="card company-contact"
      aria-labelledby="company-contact-title"
    >
      <div className="company-contact-header">
        <div>
          <span className="eyebrow">INFORMAÇÕES INSTITUCIONAIS</span>
          <h2 id="company-contact-title">Lavilli Jet · Jundiaí</h2>
        </div>
        <BrandLogo variant="blue" />
      </div>
      <div className="company-contact-grid">
        <section>
          <h3>
            <MapPin size={17} /> Endereço
          </h3>
          <address>
            {company.address.street}
            <br />
            {company.address.district}
            <br />
            {company.address.city} · {company.address.state}
            <br />
            CEP {company.address.postalCode}
          </address>
          <a href={company.map} target="_blank" rel="noopener noreferrer">
            Cabeceira no mapa <ArrowUpRight size={14} />
          </a>
        </section>
        <section>
          <h3>
            <Phone size={17} /> Telefones
          </h3>
          <a
            href={company.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {company.whatsapp.label} · {company.whatsapp.availability}
          </a>
          <a href={company.phone.href}>{company.phone.label}</a>
          <h3 className="contact-email-label">
            <Mail size={17} /> E-mail
          </h3>
          <a href={"mailto:" + company.email}>{company.email}</a>
        </section>
        <section>
          <h3>Site e políticas</h3>
          <a href={company.website} target="_blank" rel="noopener noreferrer">
            Site institucional <ArrowUpRight size={14} />
          </a>
          <a
            href={company.cookiesPolicy}
            target="_blank"
            rel="noopener noreferrer"
          >
            Política de Cookies <ArrowUpRight size={14} />
          </a>
          <a
            href={company.privacyPolicy}
            target="_blank"
            rel="noopener noreferrer"
          >
            Política de Privacidade <ArrowUpRight size={14} />
          </a>
        </section>
      </div>
      <div className="hangar-gallery">
        <figure>
          <Image
            src="/brand/hangar-front.jpg"
            alt="Vista frontal do hangar Lavilli Jet em Jundiaí"
            width={900}
            height={600}
            sizes="(max-width: 760px) 100vw, 45vw"
          />
          <figcaption>Hangar Lavilli Jet</figcaption>
        </figure>
        <figure>
          <Image
            src="/brand/hangar-aircraft.jpg"
            alt="Aeronave no interior do hangar, ao lado da identificação Lavilli Jet"
            width={900}
            height={600}
            sizes="(max-width: 760px) 100vw, 45vw"
          />
          <figcaption>Estrutura e identidade da empresa</figcaption>
        </figure>
      </div>
    </section>
  );
}
