import { NextResponse } from "next/server";
import { z } from "zod";
import {
  session,
  sameOrigin,
  checkPin,
  limit,
  clearLimit,
} from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { failure } from "@/lib/server/errors";
import { operationHash } from "@/lib/domain/security";
import { parseCommand } from "@/lib/domain/commands";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const s = await session();
    await limit("confirm", s.device_id);
    const b = z
      .object({
        pin: z.string().length(4),
        mechanic_id: z.uuid(),
        operation_id: z.uuid(),
        command: z.unknown(),
      })
      .strict()
      .parse(await request.json());
    await checkPin(b.pin);
    await clearLimit("confirm", s.device_id);
    const command = parseCommand(b.command);
    const { data: actor, error: aerr } = await db()
      .from("mechanics")
      .select("id")
      .eq("id", b.mechanic_id)
      .eq("active", true)
      .maybeSingle();
    if (aerr || !actor) throw new Error("FORBIDDEN");
    const hash = operationHash({ operation_id: b.operation_id, command });
    const { data, error } = await db()
      .from("confirmations")
      .insert({
        session_id: s.id,
        mechanic_id: actor.id,
        operation_hash: hash,
        expires_at: new Date(Date.now() + 120000).toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ confirmation_id: data.id });
  } catch (e) {
    return failure(e);
  }
}
