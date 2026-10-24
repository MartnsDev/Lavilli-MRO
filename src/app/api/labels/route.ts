import { NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { session } from "@/lib/server/auth";
import { get } from "@/lib/server/queries";
import { failure } from "@/lib/server/errors";
function escape(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export async function GET(request: Request) {
  try {
    await session();
    const u = new URL(request.url);
    const entity = z
        .enum(["tools", "tool_kits", "locations", "part_instances"])
        .parse(u.searchParams.get("entity")),
      id = z.uuid().parse(u.searchParams.get("id"));
    const width = z.coerce
        .number()
        .min(30)
        .max(200)
        .parse(u.searchParams.get("width") ?? 60),
      height = z.coerce
        .number()
        .min(30)
        .max(200)
        .parse(u.searchParams.get("height") ?? 40);
    const r = await get(entity, id);
    const qr = await QRCode.toDataURL(
      `${process.env.APP_URL}/records/${entity}/${id}`,
      { width: 200, margin: 1 },
    );
    return new NextResponse(
      `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Etiqueta | Lavilli Jet</title><style>@page{size:${width}mm ${height}mm;margin:2mm}body{font:12px Arial;text-align:center;margin:0}img{height:${height - 13}mm;max-width:90%}p{margin:1mm}@media print{button{display:none}}</style><p><strong>LAVILLI JET</strong> · ${escape(String(r.code ?? r.serial_number ?? r.name ?? ""))}</p><img src="${qr}" alt="QR Code da ficha autenticada"><p>${escape(String(r.name ?? "Controle operacional interno"))}</p><p>Use a opção Imprimir do navegador.</p></html>`,
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (e) {
    return failure(e);
  }
}
