import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db, rpc } from "@/lib/server/db";
import { failure } from "@/lib/server/errors";
import { sendMail } from "@/lib/server/mail";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const expected = process.env.CRON_SECRET,
      received = request.headers.get("authorization") ?? "";
    if (
      !expected ||
      expected.length < 32 ||
      received.length !== expected.length + 7 ||
      !timingSafeEqual(Buffer.from(received), Buffer.from("Bearer " + expected))
    )
      throw new Error("FORBIDDEN");
    const inserted = await rpc<number>("generate_alerts", {});
    if (process.env.EMAIL_MODE !== "resend")
      return NextResponse.json({ alerts: inserted, email: "disabled" });
    const queue = await rpc<
      {
        id: string;
        alert_id: string;
        recipient_id: string;
        attempts: number;
        dedup_key: string;
      }[]
    >("claim_emails", {});
    let sent = 0;
    for (const item of queue) {
      let patch: Record<string, unknown>;
      try {
        const [{ data: alert, error: ae }, { data: recipient, error: re }] =
          await Promise.all([
            db()
              .from("alerts")
              .select("name,entity,entity_id,status")
              .eq("id", item.alert_id)
              .single(),
            db()
              .from("notification_recipients")
              .select("email,active")
              .eq("id", item.recipient_id)
              .single(),
          ]);
        if (ae || re || !recipient?.active || !alert)
          throw new Error("RECIPIENT_UNAVAILABLE");
        const providerId = await sendMail(
          recipient.email,
          "Lavilli Jet | " + alert.name,
          `${alert.name}\nControle operacional interno.\n${process.env.APP_URL}/records/${alert.entity}/${alert.entity_id}`,
          item.dedup_key,
        );
        patch = {
          status: "sent",
          provider_id: providerId,
          lease_until: null,
          last_error: null,
        };
        sent++;
      } catch {
        patch = {
          status: "failed",
          last_error: "Falha no envio ou destinatário indisponível",
          lease_until: null,
          next_attempt_at: new Date(
            Date.now() + Math.min(86400, 60 * 2 ** item.attempts) * 1000,
          ).toISOString(),
        };
      }
      const { error } = await db()
        .from("email_deliveries")
        .update(patch)
        .eq("id", item.id);
      if (error) throw error;
      const { error: auditError } = await db()
        .from("audit_events")
        .insert({
          entity: "email_deliveries",
          entity_id: item.id,
          action: patch.status,
          after_data: {
            status: patch.status,
            attempt: item.attempts,
            actor: "Sistema",
          },
        });
      if (auditError) throw auditError;
    }
    return NextResponse.json({ alerts: inserted, sent });
  } catch (e) {
    return failure(e);
  }
}
