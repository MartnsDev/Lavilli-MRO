import { audit } from "@/lib/server/audit";
import { redirect } from "next/navigation";
import { configured, infrastructureConfigured } from "@/lib/server/db";
import { session } from "@/lib/server/auth";
import { PhotoDraftProvider } from "@/components/photo-draft";
import { OperationRefreshProvider } from "@/components/operation-refresh";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function Protected({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!infrastructureConfigured()) redirect("/setup");
  if (!configured()) redirect("/login");
  try {
    await session();
  } catch {
    await audit("page_access_denied");
    redirect("/login");
  }
  return (
    <OperationRefreshProvider>
      <PhotoDraftProvider>
        <Shell demo={["demo", "test"].includes(process.env.APP_MODE || "")}>
          {children}
        </Shell>
      </PhotoDraftProvider>
    </OperationRefreshProvider>
  );
}
