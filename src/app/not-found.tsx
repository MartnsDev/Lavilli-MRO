import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-panel">
      <h1>Registro não encontrado</h1>
      <Link href="/dashboard">Voltar ao painel</Link>
    </main>
  );
}
