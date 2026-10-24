import { redirect } from "next/navigation";
import { configured } from "@/lib/server/db";
import { session } from "@/lib/server/auth";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function Protected({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!configured()) redirect("/setup");
  try {
    await session();
  } catch {
    redirect("/login");
  }
  return <Shell>{children}</Shell>;
}
