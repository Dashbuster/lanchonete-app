import { getPublicSiteSettings } from "@/lib/public-settings"
import { CheckoutClient } from "./checkout-client"

export const dynamic = "force-dynamic"

export default async function CheckoutPage() {
  const settings = await getPublicSiteSettings()

  return <CheckoutClient settings={settings} />
}
