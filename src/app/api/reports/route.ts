import { NextResponse } from "next/server";
import { z } from "zod";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { session, requireElevation, limit } from "@/lib/server/auth";
import { db, rpc } from "@/lib/server/db";
import { failure } from "@/lib/server/errors";
import { safeCSV } from "@/lib/domain/security";
import { resources, label } from "@/lib/domain/resources";
import { dateBR } from "@/lib/utils";
export async function GET(request: Request) {
  try {
    const s = await session();
    requireElevation(s);
    await limit("export", s.device_id);
    const u = new URL(request.url);
    const entity = z
      .enum([
        "stock_lots",
        "stock_movements",
        "physical_count_items",
        "tools",
        "tool_checkouts",
        "tool_calibrations",
        "aircraft",
        "maintenance_tasks",
        "work_orders",
        "external_shipments",
        "audit_events",
        "alerts",
      ])
      .parse(u.searchParams.get("entity"));
    const page = z.coerce
      .number()
      .int()
      .min(1)
      .max(10000)
      .parse(u.searchParams.get("page") ?? 1);
    const format = z
      .enum(["csv", "pdf"])
      .parse(u.searchParams.get("format") ?? "csv");
    const from = u.searchParams.get("from"),
      to = u.searchParams.get("to"),
      status = u.searchParams.get("status");
    let query = db()
      .from(entity)
      .select("*")
      .order("created_at", { ascending: false })
      .range((page - 1) * 1000, page * 1000 - 1);
    if (from)
      query = query.gte(
        "created_at",
        z.iso.date().parse(from) + "T00:00:00-03:00",
      );
    if (to)
      query = query.lte(
        "created_at",
        z.iso.date().parse(to) + "T23:59:59.999-03:00",
      );
    if (status) {
      if (
        ![
          "tools",
          "maintenance_tasks",
          "work_orders",
          "external_shipments",
          "alerts",
        ].includes(entity)
      )
        throw new Error("INVALID_OPERATION");
      query = query.eq(
        "status",
        z
          .string()
          .regex(/^[a-z_]{1,40}$/)
          .parse(status),
      );
    }
    const { data, error } = await query;
    if (error) throw error;
    await rpc("security_event", {
      p_kind: "export",
      p_session: s.id,
      p_entity: entity,
      p_outcome: "success",
    });
    const rows = data ?? [],
      keys = rows.length ? Object.keys(rows[0]) : ["id"];
    const now = dateBR(new Date().toISOString());
    const filter = `De: ${from || "início"}; até: ${to || "hoje"}; situação: ${status || "todas"}; página: ${page}`;
    const headers = {
      "Content-Disposition": `attachment; filename="lavilli-${entity}-${page}.${format}"`,
      "Cache-Control": "no-store",
    };
    if (format === "csv") {
      return new NextResponse(
        "\uFEFF" +
          [
            keys.map(safeCSV).join(","),
            ...rows.map((row) =>
              keys
                .map((k) =>
                  safeCSV(
                    typeof row[k] === "object"
                      ? JSON.stringify(row[k])
                      : row[k],
                  ),
                )
                .join(","),
            ),
          ].join("\r\n"),
        { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" } },
      );
    }
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    let sheet = pdf.addPage([842, 595]),
      y = 557;
    const sanitize = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
    function line(text: string, size = 8) {
      if (y < 35) {
        sheet = pdf.addPage([842, 595]);
        y = 557;
      }
      sheet.drawText(sanitize(text).slice(0, 155), {
        x: 30,
        y,
        size,
        font,
        color: rgb(0.1, 0.17, 0.25),
      });
      y -= size + 8;
    }
    line("Lavilli Jet | " + resources[entity].title, 16);
    line("Controle operacional interno | Gerado em " + now, 9);
    line(filter);
    line(
      "Página de dados " +
        page +
        " | " +
        rows.length +
        " registros (máximo 1.000)",
    );
    const cols = resources[entity].fields.length
      ? resources[entity].fields.slice(0, 5).map((f) => f.key)
      : keys
          .filter((k) => !["before_data", "after_data"].includes(k))
          .slice(0, 6);
    line(cols.join(" | "), 9);
    for (const row of rows) {
      line(cols.map((k) => label(row[k]).slice(0, 35)).join(" | "));
    }
    return new NextResponse(Buffer.from(await pdf.save()), {
      headers: { ...headers, "Content-Type": "application/pdf" },
    });
  } catch (e) {
    return failure(e);
  }
}
