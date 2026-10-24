import { db, rpc } from "@/lib/server/db";
import { randomUUID, createHash } from "node:crypto";
import { token } from "@/lib/domain/security";
import { formBody } from "@/lib/server/request";
import { NextResponse } from "next/server";
import { session, sameOrigin, limit } from "@/lib/server/auth";
import { failure } from "@/lib/server/errors";
import { parseImport } from "@/lib/domain/imports";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const s = await session();
    await limit("upload", s.device_id);
    if (Number(request.headers.get("content-length")) > 2200000)
      throw new Error("INVALID_OPERATION");
    const f = (await formBody(request, 2200000)).get("file");
    if (!(f instanceof File) || f.size > 2097152)
      throw new Error("INVALID_OPERATION");
    const bytes = Buffer.from(await f.arrayBuffer());
    const rows = await parseImport(f.name, bytes);
    await rpc("reserve_upload", { p_session: s.id, p_size: bytes.length });
    const path = `imports/${randomUUID()}/${token()}`;
    const { error: uploadError } = await db()
      .storage.from("import-originals")
      .upload(path, bytes, {
        contentType: f.name.toLowerCase().endsWith(".csv")
          ? "text/csv"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: false,
      });
    if (uploadError) throw Error("INTERNAL");
    let source_id: string;
    try {
      source_id = await rpc<string>("register_import_source", {
        p_session: s.id,
        p_path: path,
        p_hash: createHash("sha256").update(bytes).digest("hex"),
        p_name: f.name.slice(0, 200),
        p_size: bytes.length,
      });
    } catch {
      await db().storage.from("import-originals").remove([path]);
      throw Error("INTERNAL");
    }
    return NextResponse.json({
      source_id,
      headers: rows[0] ?? [],
      rows: rows.slice(1),
    });
  } catch (e) {
    return failure(e);
  }
}
