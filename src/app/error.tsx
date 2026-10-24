"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-panel">
      <h1>Não foi possível carregar os dados</h1>
      <p>
        Confira a configuração do Supabase e tente novamente. Nenhum dado
        fictício foi exibido.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </main>
  );
}
