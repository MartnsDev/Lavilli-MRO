import { Plane, ShieldCheck, Database, KeyRound } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
export default function Setup() {
  return (
    <main className="auth-page">
      <div className="auth-top">
        <span className="wordmark">
          <Plane /> LAVILLI JET
        </span>
        <ThemeToggle />
      </div>
      <section className="setup-card">
        <span className="eyebrow">GESTÃO DO HANGAR</span>
        <h1>
          Uma base segura para
          <br />a operação do hangar.
        </h1>
        <p>
          O servidor precisa ser configurado antes do primeiro acesso. Seus
          dados operacionais serão mantidos no Supabase.
        </p>
        <div className="setup-steps">
          <article>
            <Database />
            <div>
              <h2>1. Preparar o banco</h2>
              <p>
                Configure o Supabase e aplique as migrations versionadas com
                revisão prévia.
              </p>
            </div>
          </article>
          <article>
            <KeyRound />
            <div>
              <h2>2. Configurar os segredos</h2>
              <p>
                Defina o hash da senha geral, o segredo de sessão e a URL da
                aplicação no ambiente do servidor.
              </p>
            </div>
          </article>
          <article>
            <ShieldCheck />
            <div>
              <h2>3. Autorizar o primeiro dispositivo</h2>
              <p>
                Use um código de recuperação de uso único, gerado com alta
                entropia. Depois, entre com a senha geral.
              </p>
            </div>
          </article>
        </div>
        <p className="notice">
          Consulte README.md e docs/deployment.md no projeto. Esta página não
          exibe segredos nem libera acesso aos dados.
        </p>
        <a className="button outline" href="/login">
          Ir para o acesso
        </a>
      </section>
    </main>
  );
}
