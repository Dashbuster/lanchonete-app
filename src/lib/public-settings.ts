import { prisma } from "@/lib/prisma"

type DayHours = {
  open: string
  close: string
  isOpen: boolean
}

export type PublicSiteSettings = {
  storeName: string
  storeLogo: string | null
  storeOpen: boolean
  whatsapp: string
  instagramUrl: string
  deliveryFee: number
  minOrderValue: number
  acceptsPickup: boolean
  dayHours: Record<string, DayHours>
  paymentMethods: {
    PIX: boolean
    CREDIT_CARD: boolean
    DEBIT_CARD: boolean
    CASH: boolean
    ON_SITE: boolean
  }
  regionLabel: string
  regionCenter: string
  regionNotes: string
  neighborhoods: string[]
}

const defaultDayHours: DayHours = { open: "18:00", close: "23:00", isOpen: true }

const defaultSettings: PublicSiteSettings = {
  storeName: "Lanchonete do Ze",
  storeLogo: null,
  storeOpen: true,
  whatsapp: "(11) 99999-0000",
  instagramUrl: "https://instagram.com/lanchonetedoze",
  deliveryFee: 6.9,
  minOrderValue: 15,
  acceptsPickup: true,
  dayHours: {
    monday: { ...defaultDayHours, open: "18:00", close: "23:00" },
    tuesday: { ...defaultDayHours, open: "18:00", close: "23:00" },
    wednesday: { ...defaultDayHours, open: "18:00", close: "23:00" },
    thursday: { ...defaultDayHours, open: "18:00", close: "23:00" },
    friday: { ...defaultDayHours, open: "18:00", close: "00:00" },
    saturday: { ...defaultDayHours, open: "17:00", close: "00:00" },
    sunday: { ...defaultDayHours, open: "17:00", close: "22:00" },
  },
  paymentMethods: {
    PIX: true,
    CREDIT_CARD: true,
    DEBIT_CARD: true,
    CASH: true,
    ON_SITE: false,
  },
  regionLabel: "Area de atendimento",
  regionCenter: "Consulte a regiao cadastrada no atendimento.",
  regionNotes: "",
  neighborhoods: [],
}

function parseDayHours(value: string | undefined) {
  if (!value) return defaultSettings.dayHours

  try {
    const parsed = JSON.parse(value) as Record<string, Partial<DayHours>>
    return Object.keys(defaultSettings.dayHours).reduce<Record<string, DayHours>>(
      (acc, key) => {
        const day = parsed[key]
        const fallback = defaultSettings.dayHours[key]
        acc[key] = {
          open: typeof day?.open === "string" && day.open ? day.open : fallback.open,
          close: typeof day?.close === "string" && day.close ? day.close : fallback.close,
          isOpen: typeof day?.isOpen === "boolean" ? day.isOpen : fallback.isOpen,
        }
        return acc
      },
      {}
    )
  } catch {
    return defaultSettings.dayHours
  }
}

function deriveRegionLabel(
  rawLabel: string | undefined,
  rawCenter: string | undefined,
  neighborhoods: string[]
) {
  const label = rawLabel?.trim()
  if (label) return label

  if (neighborhoods.length === 1) return neighborhoods[0]
  if (neighborhoods.length > 1) {
    return `${neighborhoods[0]} + ${neighborhoods.length - 1} bairros`
  }

  const center = rawCenter?.trim()
  if (center) return center

  return defaultSettings.regionLabel
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: "asc" },
    })

    const map: Record<string, string> = {}
    for (const setting of settings) {
      map[setting.key] = setting.value
    }

    const neighborhoods = (map.delivery_neighborhoods ?? "")
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)

    const deliveryFee = Number(map.delivery_fee)
    const minOrderValue = Number(map.min_order_value)

    return {
      storeName: map.store_name?.trim() || defaultSettings.storeName,
      storeLogo: map.store_logo || null,
      storeOpen: map.store_open ? map.store_open === "true" : true,
      whatsapp: map.whatsapp || defaultSettings.whatsapp,
      instagramUrl: map.instagram || defaultSettings.instagramUrl,
      deliveryFee: Number.isFinite(deliveryFee) ? deliveryFee : defaultSettings.deliveryFee,
      minOrderValue: Number.isFinite(minOrderValue) ? minOrderValue : defaultSettings.minOrderValue,
      acceptsPickup: map.accepts_pickup ? map.accepts_pickup === "true" : defaultSettings.acceptsPickup,
      dayHours: parseDayHours(map.store_day_hours),
      paymentMethods: {
        PIX: map.payment_pix ? map.payment_pix === "true" : defaultSettings.paymentMethods.PIX,
        CREDIT_CARD: map.payment_credit_card
          ? map.payment_credit_card === "true"
          : defaultSettings.paymentMethods.CREDIT_CARD,
        DEBIT_CARD: map.payment_debit_card
          ? map.payment_debit_card === "true"
          : defaultSettings.paymentMethods.DEBIT_CARD,
        CASH: map.payment_cash ? map.payment_cash === "true" : defaultSettings.paymentMethods.CASH,
        ON_SITE: map.payment_on_site
          ? map.payment_on_site === "true"
          : defaultSettings.paymentMethods.ON_SITE,
      },
      regionLabel: deriveRegionLabel(
        map.delivery_region_label,
        map.delivery_region_center,
        neighborhoods
      ),
      regionCenter: map.delivery_region_center?.trim() || defaultSettings.regionCenter,
      regionNotes: map.delivery_region_notes?.trim() || defaultSettings.regionNotes,
      neighborhoods,
    }
  } catch (error) {
    console.error("Erro ao carregar configuracoes publicas:", error)
    return defaultSettings
  }
}
