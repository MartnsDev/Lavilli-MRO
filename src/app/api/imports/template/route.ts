import { NextResponse } from "next/server";
import { session } from "@/lib/server/auth";
import { failure } from "@/lib/server/errors";
import { resources } from "@/lib/domain/resources";
export async function GET(request: Request) {
  try {
    await session();
    const c = new URL(request.url).searchParams.get("category") ?? "";
    if (
      ![
        "locations",
        "organizations",
        "aircraft",
        "part_catalog",
        "tools",
        "stock_lots",
      ].includes(c)
    )
      throw new Error("INVALID_OPERATION");
    return new NextResponse(
      "\uFEFF" + resources[c].fields.map((f) => f.key).join(",") + "\r\n",
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="modelo-${c}.csv"`,
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (e) {
    return failure(e);
  }
}
