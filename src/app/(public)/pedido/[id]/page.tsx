import { getPublicSiteSettings } from "@/lib/public-settings"
import { OrderTrackingClient } from "./order-tracking-client"

export const dynamic = "force-dynamic"

export default async function OrderTrackingPage({
  params,
}: {
  params: { id: string }
}) {
  const settings = await getPublicSiteSettings()

  return <OrderTrackingClient orderId={params.id} storeName={settings.storeName} />
}
