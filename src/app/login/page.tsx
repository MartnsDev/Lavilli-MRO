import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Plane, ShieldCheck } from "lucide-react";
export default function Login() {
  return (
    <main className="auth-page">
      <div className="auth-top">
        <span className="wordmark">
          <Plane /> LAVILLI JET
        </span>
        <ThemeToggle />
      </div>
      <section className="login-card">
        <span className="auth-icon">
          <ShieldCheck size={28} />
        </span>
        <span className="eyebrow">GESTÃO DO HANGAR</span>
        <h1>Acesso à operação</h1>
        <p>
          Entre em um dispositivo autorizado usando a senha geral do hangar.
        </p>
        <LoginForm />
        <p className="fine-print">
          Responsáveis são informados em cada alteração. Os registros não
          representam assinatura técnica oficial.
        </p>
      </section>
    </main>
  );
}
