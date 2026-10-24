import { spawnSync } from "node:child_process";
import fs from "node:fs";
const query = `select coalesce(json_agg(row_to_json(c)),'[]'::json) from (select table_name,column_name,udt_name,is_nullable,column_default,is_identity from information_schema.columns where table_schema='public' order by table_name,ordinal_position)c`;
const result = spawnSync(
  "psql",
  ["-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", query],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      ...(process.env.DATABASE_URL
        ? { PGDATABASE: process.env.DATABASE_URL }
        : {}),
    },
  },
);
if (result.status !== 0)
  throw Error(
    "Falha na introspecção. Configure DATABASE_URL ou variáveis PG*.",
  );
const columns = JSON.parse(result.stdout),
  tables = {};
for (const c of columns) (tables[c.table_name] ??= []).push(c);
if (!tables.stock_lots || !tables.access_sessions)
  throw Error(
    "Esquema Lavilli não encontrado. Aplique migrations no destino isolado.",
  );
function type(c) {
  const t = c.udt_name;
  return [
    "uuid",
    "text",
    "varchar",
    "timestamptz",
    "timestamp",
    "date",
  ].includes(t)
    ? "string"
    : ["int2", "int4", "int8", "float4", "float8", "numeric"].includes(t)
      ? "number"
      : t === "bool"
        ? "boolean"
        : ["json", "jsonb"].includes(t)
          ? "Json"
          : "unknown";
}
let output =
  "// Generated from PostgreSQL information_schema. Run npm run db:types after migrations.\nexport type Json = string | number | boolean | null | { [key:string]: Json | undefined } | Json[];\nexport type Database = { public: { Tables: {\n";
for (const [name, cols] of Object.entries(tables)) {
  output += `${JSON.stringify(name)}: {\n`;
  for (const kind of ["Row", "Insert", "Update"]) {
    output += `${kind}: {\n`;
    for (const c of cols) {
      const optional =
        kind === "Update" ||
        (kind === "Insert" &&
          (c.column_default !== null ||
            c.is_identity === "YES" ||
            c.is_nullable === "YES"));
      output += `${JSON.stringify(c.column_name)}${optional ? "?" : ""}: ${type(c)}${c.is_nullable === "YES" ? " | null" : ""};\n`;
    }
    output += "};\n";
  }
  output += "Relationships: [];\n};\n";
}
output +=
  "}; Views: Record<string,never>; Functions: { run_operation: { Args: { p_session:string; p_confirmation:string; p_operation:string; p_hash:string; p_command:Json }; Returns:Json }; }; Enums: Record<string,never>; CompositeTypes: Record<string,never>; }; };\n";
fs.writeFileSync("src/lib/database.types.ts", output);
console.log(`Tipos gerados para ${Object.keys(tables).length} tabelas.`);
