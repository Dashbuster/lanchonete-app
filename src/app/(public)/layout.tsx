import { getPublicSiteSettings } from "@/lib/public-settings"
import { PublicShell } from "./public-shell"

export const dynamic = "force-dynamic"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getPublicSiteSettings()

  return <PublicShell settings={settings}>{children}</PublicShell>
}
