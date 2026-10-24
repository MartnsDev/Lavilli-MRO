import { ImportWizard } from "@/components/import-wizard";
import Link from "next/link";
export default function Imports() {
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">CADASTRO EM LOTE</span>
        <h1>Importar Excel ou CSV</h1>
        <p>
          Prévia e validação antes de qualquer alteração. Até 100 linhas por
          operação e arquivo de 2 MB.
        </p>
      </div>
      <ImportWizard />
      <p className="notice">
        Importações criam cadastros ou ignoram duplicados. Alterações em
        registros existentes devem ser feitas pela ficha. Saldos e condições não
        são sobrescritos pela importação.
      </p>
      <Link className="button outline" href="/records/import_jobs">
        Histórico de importações
      </Link>
    </>
  );
}
