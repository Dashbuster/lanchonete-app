import { getPublicSiteSettings } from "@/lib/public-settings"
import { HomeClient } from "./home-client"

export const dynamic = "force-dynamic"

export default async function PublicPage() {
  const settings = await getPublicSiteSettings()

  return <HomeClient initialSettings={settings} />
}
