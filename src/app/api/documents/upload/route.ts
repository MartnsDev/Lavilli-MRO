import { NextResponse } from "next/server";
import { z } from "zod";
import { session, sameOrigin } from "@/lib/server/auth";
import { db, rpc } from "@/lib/server/db";
import { failure } from "@/lib/server/errors";
import { parseCommand } from "@/lib/domain/commands";
import { digest, operationHash, token } from "@/lib/domain/security";
import { createHash } from "node:crypto";
import { fileType, validExtension } from "@/lib/domain/files";
export async function POST(request: Request) {
  let objectPath: string | undefined;
  try {
    sameOrigin(request);
    const s = await session();
    if (Number(request.headers.get("content-length")) > 4500000)
      throw new Error("INVALID_OPERATION");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 4194304 || file.size === 0)
      throw new Error("INVALID_OPERATION");
    const p = z
      .object({
        operation_id: z.uuid(),
        confirmation_id: z.uuid(),
        command: z.unknown(),
      })
      .strict()
      .parse(JSON.parse(String(form.get("payload"))));
    const command = parseCommand(p.command);
    if (command.action !== "document_version")
      throw new Error("INVALID_OPERATION");
    const bytes = Buffer.from(await file.arrayBuffer()),
      mime = fileType(bytes);
    const sha = createHash("sha256").update(bytes).digest("hex");
    if (
      !mime ||
      !validExtension(file.name, mime) ||
      command.data?.sha256 !== sha ||
      command.data?.mime_type !== mime ||
      command.data?.size_bytes !== bytes.length
    )
      throw new Error("INVALID_OPERATION");
    const hash = operationHash({ operation_id: p.operation_id, command });
    const { data: conf, error: ce } = await db()
      .from("confirmations")
      .select("id")
      .eq("id", p.confirmation_id)
      .eq("session_id", s.id)
      .eq("operation_hash", hash)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (ce || !conf) throw new Error("FORBIDDEN");
    objectPath = `${command.data.document_id}/${digest(p.operation_id)}/${token()}`;
    const { error: uploadError } = await db()
      .storage.from("operational-documents")
      .upload(objectPath, bytes, { contentType: mime, upsert: false });
    if (uploadError) throw uploadError;
    const result = await rpc<{ object_path: string }>("run_operation", {
      p_session: s.id,
      p_confirmation: p.confirmation_id,
      p_operation: p.operation_id,
      p_hash: hash,
      p_command: {
        ...command,
        data: { ...command.data, object_path: objectPath },
      },
    });
    if (result.object_path !== objectPath)
      await db().storage.from("operational-documents").remove([objectPath]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (objectPath)
      await db().storage.from("operational-documents").remove([objectPath]);
    return failure(e);
  }
}
