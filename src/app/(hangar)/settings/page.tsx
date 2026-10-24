import { SecurityControls } from "@/components/security-controls";
import { session } from "@/lib/server/auth";
import Link from "next/link";
import { resources } from "@/lib/domain/resources";

export default async function Settings() {
  await session();
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">ADMINISTRAÇÃO COMPARTILHADA</span>
        <h1>Configurações</h1>
        <p>
          Os responsáveis do hangar podem administrar. Alterações exigem
          reconfirmação.
        </p>
      </div>
      <SecurityControls />
      <div className="link-grid">
        {[
          "mechanics",
          "locations",
          "organizations",
          "app_settings",
          "notification_rules",
          "notification_recipients",
          "email_deliveries",
        ].map((key) => (
          <Link className="card link-card" key={key} href={"/records/" + key}>
            <h2>{resources[key].title}</h2>
            <p>{resources[key].description}</p>
            <span>Abrir →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
