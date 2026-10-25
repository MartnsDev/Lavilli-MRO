import "server-only";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { rpc, db, securityBoundaryReady, infrastructureConfigured } from "./db";
export async function audit(
  kind: string,
  sessionId: string | null = null,
  entity = "security",
  id: string | null = null,
  outcome = "denied",
  required = false,
) {
  if (!infrastructureConfigured()) return;
  let requestId = randomUUID();
  try {
    const h = await headers();
    const value = h.get("x-request-id");
    if (value && /^[a-f0-9-]{36}$/.test(value))
      requestId = value as typeof requestId;
  } catch {}
  try {
    if (!(await securityBoundaryReady())) {
      const { error } = await db()
        .from("audit_events")
        .insert({
          entity,
          entity_id: id,
          action: kind,
          after_data: { session_id: sessionId, outcome, request_id: requestId },
        });
      if (error) throw Error("INTERNAL");
      return;
    }
    await rpc("security_event", {
      p_kind: kind,
      p_session: sessionId,
      p_entity: entity,
      p_entity_id: id,
      p_outcome: outcome,
      p_request: requestId,
    });
  } catch {
    if (required) throw Error("INTERNAL");
    console.error(
      JSON.stringify({ event: "audit_unavailable", request_id: requestId }),
    );
  }
}
