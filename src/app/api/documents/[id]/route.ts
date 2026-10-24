import { NextResponse } from "next/server";
import { z } from "zod";
import { session } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { failure } from "@/lib/server/errors";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await session();
    const id = z.uuid().parse((await params).id);
    const { data, error } = await db()
      .from("document_versions")
      .select("object_path")
      .eq("id", id)
      .single();
    if (error || !data) throw new Error("NOT_FOUND");
    const { data: signed, error: se } = await db()
      .storage.from("operational-documents")
      .createSignedUrl(data.object_path, 60, { download: true });
    if (se || !signed) throw se;
    return NextResponse.redirect(signed.signedUrl, {
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
