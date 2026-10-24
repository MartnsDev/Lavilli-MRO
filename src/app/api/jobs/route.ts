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
      Buffer.byteLength(received) !== Buffer.byteLength(expected) + 7 ||
      !timingSafeEqual(Buffer.from(received), Buffer.from("Bearer " + expected))
    )
      throw new Error("FORBIDDEN");
    if (!(await rpc<boolean>("claim_job", {})))
      return NextResponse.json({ status: "already_running" }, { status: 409 });
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
      await rpc("security_event", {
        p_kind: "email_delivery",
        p_entity: "email_deliveries",
        p_entity_id: item.id,
        p_outcome: patch.status === "sent" ? "success" : "failed",
      });
    }
    return NextResponse.json({ alerts: inserted, sent });
  } catch (e) {
    return failure(e);
  }
}
