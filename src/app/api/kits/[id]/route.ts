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
      .from("tool_kit_items")
      .select("tools(id,name,code)")
      .eq("kit_id", id)
      .is("archived_at", null);
    if (error) throw error;
    return NextResponse.json(
      { data: data.map((t) => t.tools) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
