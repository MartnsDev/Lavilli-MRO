import "server-only";
export async function sendMail(
  to: string,
  subject: string,
  text: string,
  idempotencyKey: string,
) {
  if (
    process.env.EMAIL_MODE !== "resend" ||
    !process.env.RESEND_API_KEY ||
    !process.env.EMAIL_FROM
  )
    throw new Error("EMAIL_DISABLED");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      text,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("EMAIL_FAILED");
  const result = (await response.json()) as { id: string };
  return result.id;
}
