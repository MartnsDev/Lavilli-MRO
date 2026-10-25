import { NextResponse } from "next/server";
import { z } from "zod";
import { session, limit } from "@/lib/server/auth";
import { db, rpc, securityBoundaryReady } from "@/lib/server/db";
import { failure } from "@/lib/server/errors";
import { createHash } from "node:crypto";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const s = await session();
    await limit("download", s.device_id);
    const id = z.uuid().parse((await params).id);
    if (!(await securityBoundaryReady())) throw Error("DOCUMENTS_UNAVAILABLE");
    const { data: v, error } = await db()
      .from("document_versions")
      .select("object_path,mime_type,size_bytes,sha256,scan_status")
      .eq("id", id)
      .single();
    if (error || !v) throw Error("NOT_FOUND");
    if (v.scan_status !== "clean") throw Error("DOCUMENT_PENDING");
    if (
      !/^[a-f0-9-]{36}\/[a-f0-9]{64}\/[A-Za-z0-9_-]{43}$/.test(v.object_path) ||
      v.size_bytes > 4194304
    )
      throw Error("FORBIDDEN");
    const { data: file, error: downloadError } = await db()
      .storage.from("operational-documents")
      .download(v.object_path);
    if (downloadError || !file) throw Error("NOT_FOUND");
    const bytes = Buffer.from(await file.arrayBuffer());
    if (
      bytes.length !== v.size_bytes ||
      createHash("sha256").update(bytes).digest("hex") !== v.sha256
    )
      throw Error("FORBIDDEN");
    // Validate revocation again after Storage I/O. No bearer URL leaves the server.
    await session();
    await rpc("security_event", {
      p_kind: "document_download",
      p_session: s.id,
      p_entity: "document_versions",
      p_entity_id: id,
      p_outcome: "success",
    });
    const ext =
      v.mime_type === "application/pdf"
        ? "pdf"
        : v.mime_type === "image/png"
          ? "png"
          : "jpg";
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": v.mime_type,
        "Content-Disposition": `attachment; filename="lavilli-${id}.${ext}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy": "sandbox; default-src 'none'",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
