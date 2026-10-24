import { session } from "@/lib/server/auth";
import Link from "next/link";
import { resources } from "@/lib/domain/resources";
import { db } from "@/lib/server/db";
import { DeviceList } from "@/components/device-list";
export default async function Settings() {
  await session();
  const { data, error } = await db()
    .from("authorized_devices")
    .select("id,label,created_at,expires_at,revoked_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">ADMINISTRAÇÃO COMPARTILHADA</span>
        <h1>Configurações</h1>
        <p>
          Todos os dispositivos autorizados podem administrar. Alterações exigem
          reconfirmação.
        </p>
      </div>
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
      <section className="card">
        <h2>Dispositivos autorizados</h2>
        <DeviceList rows={data ?? []} />
      </section>
    </>
  );
}
