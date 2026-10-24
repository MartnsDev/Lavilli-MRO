import { NextResponse } from "next/server";
import { session } from "@/lib/server/auth";
import { options } from "@/lib/server/queries";
import { failure } from "@/lib/server/errors";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ entity: string }> },
) {
  try {
    await session();
    return NextResponse.json(
      { data: await options((await params).entity) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
