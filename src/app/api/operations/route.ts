import { NextResponse } from "next/server";
import { z } from "zod";
import { session, sameOrigin } from "@/lib/server/auth";
import { rpc } from "@/lib/server/db";
import { failure } from "@/lib/server/errors";
import { parseCommand } from "@/lib/domain/commands";
import { operationHash } from "@/lib/domain/security";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const s = await session();
    const b = z
      .object({
        confirmation_id: z.uuid(),
        operation_id: z.uuid(),
        command: z.unknown(),
      })
      .strict()
      .parse(await request.json());
    const command = parseCommand(b.command);
    const result = await rpc("run_operation", {
      p_session: s.id,
      p_confirmation: b.confirmation_id,
      p_operation: b.operation_id,
      p_hash: operationHash({ operation_id: b.operation_id, command }),
      p_command: command,
    });
    return NextResponse.json({ data: result });
  } catch (e) {
    return failure(e);
  }
}
