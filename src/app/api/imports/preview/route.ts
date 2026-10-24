import { NextResponse } from "next/server";
import { session, sameOrigin } from "@/lib/server/auth";
import { failure } from "@/lib/server/errors";
import { parseImport } from "@/lib/domain/imports";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await session();
    if (Number(request.headers.get("content-length")) > 2200000)
      throw new Error("INVALID_OPERATION");
    const f = (await request.formData()).get("file");
    if (!(f instanceof File) || f.size > 2097152)
      throw new Error("INVALID_OPERATION");
    const rows = await parseImport(f.name, Buffer.from(await f.arrayBuffer()));
    return NextResponse.json({ headers: rows[0] ?? [], rows: rows.slice(1) });
  } catch (e) {
    return failure(e);
  }
}
