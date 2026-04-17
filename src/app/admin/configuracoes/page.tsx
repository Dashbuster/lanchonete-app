"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Switch } from "@/components/ui/Switch"
import { Badge } from "@/components/ui/Badge"
import { Textarea } from "@/components/ui/Textarea"
import { cn } from "@/utils/cn"
import {
  Save,
  Image as ImageIcon,
  Loader2,
  X,
  Clock,
  Truck,
  Phone,
  Instagram,
  CreditCard,
  DollarSign,
  Coins,
  Building2,
  Store as StoreIcon,
  MapPinned,
  Bot,
  Send,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  MessageSquareText,
} from "lucide-react"

interface DayHours {
  open: string
  close: string
  isOpen: boolean
}

interface PaymentMethod {
  id: string
  label: string
  icon: React.ReactNode
  enabled: boolean
}

interface WhatsAppConfig {
  enabled: boolean
  provider: "SIMULATED" | "WEBHOOK" | "EVOLUTION" | "META"
  apiUrl: string
  instance: string
  token: string
  metaPhoneNumberId: string
  testPhone: string
}

interface StoreSettings {
  name: string
  logo: string | null
  description: string
  heroBadge: string
  heroTitle: string
  heroHighlight: string
  heroDescription: string
  storeOpen: boolean
  dayHours: Record<string, DayHours>
  deliveryFee: number
  deliveryRadius: number
  minOrderValue: number
  acceptsPickup: boolean
  whatsapp: string
  instagramUrl: string
  paymentMethods: PaymentMethod[]
  regionLabel: string
  regionCenter: string
  regionNotes: string
  neighborhoodsText: string
  whatsappConfig: WhatsAppConfig
}

const DAYS = [
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terca" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sabado" },
  { key: "sunday", label: "Domingo" },
]

const defaultDayHours: DayHours = { open: "18:00", close: "23:00", isOpen: true }
const dayHoursStorageKey = "store_day_hours"

const defaultPaymentMethods: PaymentMethod[] = [
  { id: "PIX", label: "PIX", icon: <DollarSign className="w-5 h-5" />, enabled: true },
  { id: "CREDIT_CARD", label: "Cartao de Credito", icon: <CreditCard className="w-5 h-5" />, enabled: true },
  { id: "DEBIT_CARD", label: "Cartao de Debito", icon: <CreditCard className="w-5 h-5" />, enabled: true },
  { id: "CASH", label: "Dinheiro", icon: <Coins className="w-5 h-5" />, enabled: true },
  { id: "ON_SITE", label: "Pagamento no Local", icon: <Building2 className="w-5 h-5" />, enabled: false },
]

const mockSettings: StoreSettings = {
  name: "Lanchonete do Ze",
  logo: null,
  description: "Os melhores lanches artesanais da cidade!",
  heroBadge: "Feito com fogo & carinho",
  heroTitle: "Hamburguer",
  heroHighlight: "no ponto certo",
  heroDescription:
    "Monte combos, escolha extras, pague do seu jeito e acompanhe seu pedido em uma experiencia rapida, moderna e pensada para vender.",
  storeOpen: true,
  dayHours: createDefaultDayHours(),
  deliveryFee: 5,
  deliveryRadius: 5,
  minOrderValue: 15,
  acceptsPickup: true,
  whatsapp: "(11) 99999-0000",
  instagramUrl: "https://instagram.com/lanchonetedoze",
  paymentMethods: defaultPaymentMethods,
  regionLabel: "Zona central",
  regionCenter: "Av. Central, 245 - Centro",
  regionNotes: "Entregas em ate 45 minutos. Consulte disponibilidade para bairros mais afastados.",
  neighborhoodsText: "Centro\nJardim America\nVila Nova\nBela Vista",
  whatsappConfig: {
    enabled: false,
    provider: "SIMULATED",
    apiUrl: "",
    instance: "",
    token: "",
    metaPhoneNumberId: "",
    testPhone: "",
  },
}

interface ImageUploadProps {
  value: string | null
  onChange: (value: string | null) => void
  onUpload: (file: File) => Promise<void>
  uploading?: boolean
  size?: "small" | "medium"
}

function ImageUpload({ value, onChange, onUpload, uploading = false, size = "medium" }: ImageUploadProps) {
  const sizeClasses = size === "small" ? "w-24 h-24" : "w-32 h-32"

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await onUpload(file)
    } finally {
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-fit">
          <img
            src={value}
            alt="Logo preview"
            className={cn(
              "rounded-lg object-cover border border-dark-600 transition-opacity",
              uploading && "opacity-60",
              sizeClasses
            )}
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            </div>
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={uploading}
            className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-dark-600 cursor-pointer hover:border-brand-500 transition-colors",
            uploading && "cursor-wait opacity-70",
            sizeClasses
          )}
        >
          {uploading ? <Loader2 className="w-6 h-6 animate-spin text-dark-200" /> : <ImageIcon className="w-6 h-6 text-dark-400" />}
          <span className="mt-1 text-xs text-dark-400">{uploading ? "Enviando" : "Upload"}</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={uploading} />
        </label>
      )}
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-44 rounded bg-dark-600 animate-pulse" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-dark-600 bg-dark-800 p-6 animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="h-10 rounded bg-dark-600" />
          ))}
        </div>
      ))}
    </div>
  )
}

function parseNeighborhoods(value: string) {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function createDefaultDayHours(): Record<string, DayHours> {
  return {
    monday: { ...defaultDayHours, open: "18:00", close: "23:00" },
    tuesday: { ...defaultDayHours, open: "18:00", close: "23:00" },
    wednesday: { ...defaultDayHours, open: "18:00", close: "23:00" },
    thursday: { ...defaultDayHours, open: "18:00", close: "23:00" },
    friday: { ...defaultDayHours, open: "18:00", close: "00:00" },
    saturday: { ...defaultDayHours, open: "17:00", close: "00:00" },
    sunday: { ...defaultDayHours, open: "17:00", close: "22:00" },
  }
}

function parseDayHours(value: string | undefined): Record<string, DayHours> {
  const fallback = createDefaultDayHours()

  if (!value) return fallback

  try {
    const parsed = JSON.parse(value) as Record<string, Partial<DayHours>>
    return DAYS.reduce<Record<string, DayHours>>((acc, { key }) => {
      const day = parsed[key]
      acc[key] = {
        open: typeof day?.open === "string" && day.open ? day.open : fallback[key].open,
        close: typeof day?.close === "string" && day.close ? day.close : fallback[key].close,
        isOpen: typeof day?.isOpen === "boolean" ? day.isOpen : fallback[key].isOpen,
      }
      return acc
    }, {})
  } catch {
    return fallback
  }
}

function readSetting(
  data: Record<string, string>,
  key: string,
  fallback: string,
  allowEmpty = true
) {
  if (!(key in data)) return fallback
  if (!allowEmpty && !data[key].trim()) return fallback
  return data[key]
}

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [testingRobot, setTestingRobot] = useState(false)
  const [testStatus, setTestStatus] = useState<string | null>(null)

  const mapSettingsFromApi = useCallback((data: Record<string, string>): StoreSettings => {
    return {
      ...mockSettings,
      name: readSetting(data, "store_name", mockSettings.name, false),
      logo: "store_logo" in data ? data.store_logo || null : mockSettings.logo,
      description: readSetting(data, "store_description", mockSettings.description),
      heroBadge: readSetting(data, "hero_badge", mockSettings.heroBadge),
      heroTitle: readSetting(data, "hero_title", mockSettings.heroTitle),
      heroHighlight: readSetting(data, "hero_highlight", mockSettings.heroHighlight),
      heroDescription: readSetting(data, "hero_description", mockSettings.heroDescription),
      storeOpen: data.store_open ? data.store_open === "true" : mockSettings.storeOpen,
      dayHours: parseDayHours(data[dayHoursStorageKey]),
      deliveryFee: data.delivery_fee ? Number(data.delivery_fee) : mockSettings.deliveryFee,
      deliveryRadius: data.delivery_radius_km ? Number(data.delivery_radius_km) : mockSettings.deliveryRadius,
      minOrderValue: data.min_order_value ? Number(data.min_order_value) : mockSettings.minOrderValue,
      acceptsPickup: data.accepts_pickup ? data.accepts_pickup === "true" : mockSettings.acceptsPickup,
      whatsapp: readSetting(
        data,
        "whatsapp",
        readSetting(data, "whatsapp_phone", mockSettings.whatsapp)
      ),
      instagramUrl: readSetting(data, "instagram", mockSettings.instagramUrl),
      regionLabel: readSetting(data, "delivery_region_label", mockSettings.regionLabel),
      regionCenter: readSetting(data, "delivery_region_center", mockSettings.regionCenter),
      regionNotes: readSetting(data, "delivery_region_notes", mockSettings.regionNotes),
      neighborhoodsText: readSetting(data, "delivery_neighborhoods", mockSettings.neighborhoodsText),
      whatsappConfig: {
        enabled: data.whatsapp_robot_enabled === "true",
        provider: (data.whatsapp_provider as WhatsAppConfig["provider"]) || mockSettings.whatsappConfig.provider,
        apiUrl: data.whatsapp_api_url || "",
        instance: data.whatsapp_instance || "",
        token: data.whatsapp_token || "",
        metaPhoneNumberId: data.whatsapp_meta_phone_number_id || "",
        testPhone: data.whatsapp_test_phone || "",
      },
      paymentMethods: defaultPaymentMethods.map((method) => ({
        ...method,
        enabled:
          data[`payment_${method.id.toLowerCase()}`] !== undefined
            ? data[`payment_${method.id.toLowerCase()}`] === "true"
            : method.enabled,
      })),
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/settings")
      if (!res.ok) {
        throw new Error("Nao foi possivel carregar as configuracoes.")
      }

      const data = await res.json()
      setSettings(mapSettingsFromApi(data))
    } catch {
      setSettings(mapSettingsFromApi({}))
      setError("Erro ao carregar configuracoes do banco.")
    } finally {
      setLoading(false)
    }
  }, [mapSettingsFromApi])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const neighborhoods = useMemo(
    () => parseNeighborhoods(settings?.neighborhoodsText || ""),
    [settings?.neighborhoodsText]
  )

  const robotTestPhone = settings?.whatsappConfig.testPhone.trim() || ""

  const robotIssues = useMemo(() => {
    if (!settings) return []

    const issues: string[] = []
    const { enabled, provider, apiUrl, instance, token, metaPhoneNumberId } = settings.whatsappConfig

    if (!enabled) {
      issues.push("Ative a automacao para liberar o envio de eventos.")
    }

    if (!robotTestPhone) {
      issues.push("Informe um telefone de teste dedicado.")
    }

    if (provider === "WEBHOOK" && !apiUrl.trim()) {
      issues.push("Informe a URL do webhook para o provedor Webhook / n8n.")
    }

    if (provider === "EVOLUTION") {
      if (!apiUrl.trim()) issues.push("Informe a URL da Evolution API.")
      if (!instance.trim()) issues.push("Informe a instancia da Evolution API.")
      if (!token.trim()) issues.push("Informe o token da Evolution API.")
    }

    if (provider === "META") {
      if (!metaPhoneNumberId.trim()) issues.push("Informe o Phone Number ID da Meta.")
      if (!token.trim()) issues.push("Informe o access token permanente da Meta.")
    }

    return issues
  }, [robotTestPhone, settings])

  const robotReady = settings ? robotIssues.length === 0 : false
  const robotStatusLabel = !settings
    ? "Carregando"
    : settings.whatsappConfig.enabled
      ? robotReady
        ? "Pronto para teste"
        : "Configuracao incompleta"
      : "Desativado"

  const handleSave = async () => {
    if (!settings) return false
    setSaving(true)
    setError(null)
    try {
      const payload = [
        { key: "store_name", value: settings.name },
        { key: "store_logo", value: settings.logo || "" },
        { key: "store_description", value: settings.description },
        { key: "hero_badge", value: settings.heroBadge },
        { key: "hero_title", value: settings.heroTitle },
        { key: "hero_highlight", value: settings.heroHighlight },
        { key: "hero_description", value: settings.heroDescription },
        { key: "store_open", value: String(settings.storeOpen) },
        { key: dayHoursStorageKey, value: JSON.stringify(settings.dayHours) },
        { key: "delivery_fee", value: String(settings.deliveryFee) },
        { key: "delivery_radius_km", value: String(settings.deliveryRadius) },
        { key: "min_order_value", value: String(settings.minOrderValue) },
        { key: "accepts_pickup", value: String(settings.acceptsPickup) },
        { key: "whatsapp", value: settings.whatsapp },
        { key: "whatsapp_phone", value: settings.whatsapp },
        { key: "instagram", value: settings.instagramUrl },
        { key: "delivery_region_label", value: settings.regionLabel },
        { key: "delivery_region_center", value: settings.regionCenter },
        { key: "delivery_region_notes", value: settings.regionNotes },
        { key: "delivery_neighborhoods", value: settings.neighborhoodsText },
        { key: "whatsapp_robot_enabled", value: String(settings.whatsappConfig.enabled) },
        { key: "whatsapp_provider", value: settings.whatsappConfig.provider },
        { key: "whatsapp_api_url", value: settings.whatsappConfig.apiUrl },
        { key: "whatsapp_instance", value: settings.whatsappConfig.instance },
        { key: "whatsapp_token", value: settings.whatsappConfig.token },
        { key: "whatsapp_meta_phone_number_id", value: settings.whatsappConfig.metaPhoneNumberId },
        { key: "whatsapp_test_phone", value: settings.whatsappConfig.testPhone },
        ...settings.paymentMethods.map((method) => ({
          key: `payment_${method.id.toLowerCase()}`,
          value: String(method.enabled),
        })),
      ]

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(
          data?.error || data?.details || "Nao foi possivel salvar as configuracoes."
        )
      }

      await res.json().catch(() => null)

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      return true
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Erro ao salvar configuracoes. Nenhuma alteracao foi persistida."
      )
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true)
    setError(null)

    try {
      const form = new FormData()
      form.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Nao foi possivel enviar a logo.")
      }

      setSettings((prev) => (prev ? { ...prev, logo: data.url } : prev))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Erro ao enviar a logo.")
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRobotTest = async () => {
    if (!settings) return
    if (!settings.whatsappConfig.enabled) {
      setTestStatus("Ative a automacao antes de testar o robo.")
      return
    }

    if (!robotTestPhone) {
      setTestStatus("Informe um telefone de teste antes de enviar a mensagem.")
      return
    }

    if (settings.whatsappConfig.provider === "WEBHOOK" && !settings.whatsappConfig.apiUrl.trim()) {
      setTestStatus("Informe a URL do webhook para testar esse provedor.")
      return
    }

    if (
      settings.whatsappConfig.provider === "EVOLUTION" &&
      (!settings.whatsappConfig.apiUrl.trim() ||
        !settings.whatsappConfig.instance.trim() ||
        !settings.whatsappConfig.token.trim())
    ) {
      setTestStatus("Complete URL, instancia e token da Evolution API antes de testar.")
      return
    }

    if (
      settings.whatsappConfig.provider === "META" &&
      (!settings.whatsappConfig.metaPhoneNumberId.trim() ||
        !settings.whatsappConfig.token.trim())
    ) {
      setTestStatus("Complete o Phone Number ID e o access token da Meta antes de testar.")
      return
    }

    setTestingRobot(true)
    setTestStatus(null)
    try {
      const response = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: robotTestPhone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Nao foi possivel testar o robo.")
      }

      setTestStatus("Mensagem de teste enviada com sucesso.")
    } catch (err) {
      setTestStatus(err instanceof Error ? err.message : "Erro ao testar o robo.")
    } finally {
      setTestingRobot(false)
    }
  }

  const handleSaveAndTest = async () => {
    const savedOk = await handleSave()
    if (savedOk) {
      await handleRobotTest()
    }
  }

  const dismissStatus = () => {
    setSaved(false)
    setError(null)
    setTestStatus(null)
  }

  const updateDayHours = (day: string, field: string, value: string | boolean) => {
    if (!settings) return
    setSettings((prev) => {
      if (!prev) return prev
      const currentDay = prev.dayHours[day] || defaultDayHours
      return {
        ...prev,
        dayHours: {
          ...prev.dayHours,
          [day]: { ...currentDay, [field]: value },
        },
      }
    })
  }

  const togglePaymentMethod = (id: string) => {
    if (!settings) return
    setSettings((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        paymentMethods: prev.paymentMethods.map((pm) =>
          pm.id === id ? { ...pm, enabled: !pm.enabled } : pm
        ),
      }
    })
  }

  if (loading || !settings) {
    return <SettingsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuracoes</h1>
          <p className="text-sm text-dark-300 mt-1">Gerencie a operacao da loja, area de entrega e automacoes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={settings.storeOpen ? "success" : "danger"}>
            {settings.storeOpen ? "Loja Aberta" : "Loja Fechada"}
          </Badge>
          <Switch
            checked={settings.storeOpen}
            onCheckedChange={(checked) => setSettings((prev) => (prev ? { ...prev, storeOpen: checked } : prev))}
          />
        </div>
      </div>

      {(saved || error || testStatus) && (
        <button type="button" onClick={dismissStatus} className="block w-full text-left">
          {saved ? (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
              Configuracoes salvas com sucesso!
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : (
            <div className="rounded-lg bg-sky-500/10 border border-sky-500/30 px-4 py-3 text-sm text-sky-300">
              {testStatus}
            </div>
          )}
        </button>
      )}

      <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 space-y-6">
        <div className="flex items-center gap-2">
          <StoreIcon className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-white">Geral</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Nome da Loja</label>
            <Input
              value={settings.name}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
              placeholder="Nome da lanchonete"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Logo</label>
            <ImageUpload
              value={settings.logo}
              onChange={(val) => setSettings((prev) => (prev ? { ...prev, logo: val } : prev))}
              onUpload={handleLogoUpload}
              uploading={uploadingLogo}
              size="small"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-300">Descricao da Loja</label>
          <Textarea
            value={settings.description}
            onChange={(e) => setSettings((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
            placeholder="Texto exibido no rodape e em pontos publicos da loja"
            className="min-h-[96px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Selo do Hero</label>
            <Input
              value={settings.heroBadge}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, heroBadge: e.target.value } : prev))}
              placeholder="Ex.: Feito com fogo & carinho"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Titulo do Hero</label>
            <Input
              value={settings.heroTitle}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, heroTitle: e.target.value } : prev))}
              placeholder="Ex.: Hamburguer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Destaque do Hero</label>
            <Input
              value={settings.heroHighlight}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, heroHighlight: e.target.value } : prev))}
              placeholder="Ex.: no ponto certo"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-300">Descricao do Hero</label>
          <Textarea
            value={settings.heroDescription}
            onChange={(e) => setSettings((prev) => (prev ? { ...prev, heroDescription: e.target.value } : prev))}
            placeholder="Texto principal exibido na capa da home"
            className="min-h-[110px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">WhatsApp da loja</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <Input
                value={settings.whatsapp}
                onChange={(e) => setSettings((prev) => (prev ? { ...prev, whatsapp: e.target.value } : prev))}
                placeholder="(00) 00000-0000"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-dark-400">
              Esse numero aparece na tela inicial do site e no rodape publico.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Instagram URL</label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <Input
                value={settings.instagramUrl}
                onChange={(e) => setSettings((prev) => (prev ? { ...prev, instagramUrl: e.target.value } : prev))}
                placeholder="https://instagram.com/seuperfil"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={settings.acceptsPickup}
            onCheckedChange={(checked) => setSettings((prev) => (prev ? { ...prev, acceptsPickup: checked } : prev))}
          />
          <span className="text-sm text-dark-300">Aceita retirada no local</span>
        </div>
      </div>

      <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-white">Horario de Funcionamento</h2>
        </div>

        <div className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const day = settings.dayHours[key] || defaultDayHours
            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 px-3 rounded-lg bg-dark-700/30">
                <span className="text-sm font-medium text-white w-24">{label}</span>
                <Switch checked={day.isOpen} onCheckedChange={(checked) => updateDayHours(key, "isOpen", checked)} />
                {day.isOpen ? (
                  <div className="flex items-center gap-2">
                    <Input type="time" value={day.open} onChange={(e) => updateDayHours(key, "open", e.target.value)} className="w-32 text-sm" />
                    <span className="text-dark-400 text-sm">ate</span>
                    <Input type="time" value={day.close} onChange={(e) => updateDayHours(key, "close", e.target.value)} className="w-32 text-sm" />
                  </div>
                ) : (
                  <span className="text-sm text-dark-400 italic">Fechado</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-white">Entrega</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Taxa de Entrega (R$)</label>
            <Input type="number" step="0.5" value={settings.deliveryFee} onChange={(e) => setSettings((prev) => (prev ? { ...prev, deliveryFee: parseFloat(e.target.value) || 0 } : prev))} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Raio de Entrega (km)</label>
            <Input type="number" step="0.5" value={settings.deliveryRadius} onChange={(e) => setSettings((prev) => (prev ? { ...prev, deliveryRadius: parseFloat(e.target.value) || 0 } : prev))} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Pedido Minimo (R$)</label>
            <Input type="number" step="1" value={settings.minOrderValue} onChange={(e) => setSettings((prev) => (prev ? { ...prev, minOrderValue: parseFloat(e.target.value) || 0 } : prev))} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <MapPinned className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-white">Area de Atendimento</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Nome da regiao</label>
            <Input
              value={settings.regionLabel}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, regionLabel: e.target.value } : prev))}
              placeholder="Ex.: Zona central, Zona sul"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Ponto de referencia / endereco base</label>
            <Input
              value={settings.regionCenter}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, regionCenter: e.target.value } : prev))}
              placeholder="Ex.: Av. Central, 245 - Centro"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-300">Bairros atendidos</label>
          <Textarea
            value={settings.neighborhoodsText}
            onChange={(e) => setSettings((prev) => (prev ? { ...prev, neighborhoodsText: e.target.value } : prev))}
            placeholder={"Um bairro por linha\nCentro\nJardim America\nVila Nova"}
            rows={6}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {neighborhoods.map((name) => (
              <span key={name} className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-200">
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-300">Observacoes da cobertura</label>
          <Textarea
            value={settings.regionNotes}
            onChange={(e) => setSettings((prev) => (prev ? { ...prev, regionNotes: e.target.value } : prev))}
            placeholder="Explique limites de entrega, tempo medio e restricoes."
            rows={4}
          />
        </div>
      </div>

      <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-white">Robo do WhatsApp</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-emerald-100">
              <MessageSquareText className="w-4 h-4" />
              Fluxo automatico
            </div>
            <p>Quando ativado, o sistema dispara confirmacao do pedido, aviso de pagamento aprovado e notificacao de saida para entrega.</p>
            <div className="grid gap-2 sm:grid-cols-3 text-xs">
              <div className="rounded-lg border border-emerald-500/20 bg-black/10 px-3 py-2">1. Pedido criado</div>
              <div className="rounded-lg border border-emerald-500/20 bg-black/10 px-3 py-2">2. Pagamento aprovado</div>
              <div className="rounded-lg border border-emerald-500/20 bg-black/10 px-3 py-2">3. Em rota / saida</div>
            </div>
          </div>

          <div
            className={cn(
              "rounded-2xl border p-4 text-sm space-y-2",
              robotReady
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                : "border-amber-500/20 bg-amber-500/10 text-amber-100"
            )}
          >
            <div className="flex items-center gap-2 font-semibold">
              {robotReady ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {robotStatusLabel}
            </div>
            <p className={robotReady ? "text-emerald-200" : "text-amber-200"}>
              {settings.whatsappConfig.enabled
                ? robotReady
                  ? "Configurado para testar envio real com o telefone dedicado."
                  : "Faltam dados para liberar o teste do robo."
                : "A automacao esta desativada. O teste e os eventos ficam bloqueados ate ativar."}
            </p>
            <p className="text-xs text-white/70">Telefone de teste: {robotTestPhone || "nao informado"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={settings.whatsappConfig.enabled}
            onCheckedChange={(checked) =>
              setSettings((prev) =>
                prev
                  ? { ...prev, whatsappConfig: { ...prev.whatsappConfig, enabled: checked } }
                  : prev
              )
            }
          />
          <span className="text-sm text-dark-300">Ativar automacao no WhatsApp</span>
        </div>

        {robotIssues.length > 0 && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              Antes de testar
            </div>
            <ul className="space-y-1 text-xs leading-5 text-amber-100/90">
              {robotIssues.map((issue) => (
                <li key={issue}>- {issue}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Provedor</label>
            <select
              value={settings.whatsappConfig.provider}
              onChange={(e) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        whatsappConfig: {
                          ...prev.whatsappConfig,
                          provider: e.target.value as WhatsAppConfig["provider"],
                        },
                      }
                    : prev
                )
              }
              className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="SIMULATED">Simulado</option>
              <option value="WEBHOOK">Webhook / n8n</option>
              <option value="EVOLUTION">Evolution API</option>
              <option value="META">Meta Cloud API</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Telefone de teste</label>
            <Input
              value={settings.whatsappConfig.testPhone}
              onChange={(e) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        whatsappConfig: { ...prev.whatsappConfig, testPhone: e.target.value },
                      }
                    : prev
                )
              }
              placeholder="5511999999999"
            />
            <p className="text-xs text-dark-400">Use um numero dedicado para validar mensagens sem afetar clientes reais.</p>
          </div>
        </div>

        {settings.whatsappConfig.provider !== "META" && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-dark-300">URL da API / webhook</label>
            <Input
              value={settings.whatsappConfig.apiUrl}
              onChange={(e) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        whatsappConfig: { ...prev.whatsappConfig, apiUrl: e.target.value },
                      }
                    : prev
                )
              }
              placeholder="https://seu-robo.exemplo.com/webhook/pedidos"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Instancia / canal</label>
            <Input
              value={settings.whatsappConfig.instance}
              onChange={(e) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        whatsappConfig: { ...prev.whatsappConfig, instance: e.target.value },
                      }
                    : prev
                )
              }
              placeholder="big-night"
            />
          </div>
        </div>
        )}

        {settings.whatsappConfig.provider === "META" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Phone Number ID</label>
            <Input
              value={settings.whatsappConfig.metaPhoneNumberId}
              onChange={(e) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        whatsappConfig: {
                          ...prev.whatsappConfig,
                          metaPhoneNumberId: e.target.value,
                        },
                      }
                    : prev
                )
              }
              placeholder="123456789012345"
            />
            <p className="text-xs text-dark-400">
              Use o Phone Number ID do numero conectado no WhatsApp Cloud API da Meta.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-300">Token de autenticacao</label>
          <Input
            type="password"
            value={settings.whatsappConfig.token}
            onChange={(e) =>
              setSettings((prev) =>
                prev
                  ? {
                      ...prev,
                      whatsappConfig: { ...prev.whatsappConfig, token: e.target.value },
                    }
                  : prev
              )
            }
            placeholder="Token do robo / Evolution API"
          />
          {settings.whatsappConfig.provider === "META" && (
            <p className="text-xs text-dark-400">
              Use aqui o access token permanente do app da Meta com permissao para enviar mensagens.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-dark-200 space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            Eventos automaticos
          </div>
          <p>1. Pedido criado: mensagem de confirmacao.</p>
          <p>2. Pagamento aprovado: confirmacao de pagamento.</p>
            <p>3. Pedido marcado como pronto: mensagem de pedido pronto.</p>
            <p>4. Pedido marcado como saiu para entrega: aviso de pedido a caminho.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            disabled={testingRobot || !robotReady}
            onClick={handleRobotTest}
          >
            {testingRobot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {testingRobot ? "Enviando teste..." : "Testar robo"}
          </Button>
          <Button type="button" variant="primary" className="gap-2" disabled={saving} onClick={handleSaveAndTest}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Salvando..." : "Salvar e testar"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-white">Formas de Pagamento</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {settings.paymentMethods.map((pm) => (
            <div key={pm.id} className="flex items-center gap-3 rounded-lg border border-dark-600 bg-dark-700/50 p-3">
              <div className="text-dark-300">{pm.icon}</div>
              <span className="text-sm text-white flex-1">{pm.label}</span>
              <Switch checked={pm.enabled} onCheckedChange={() => togglePaymentMethod(pm.id)} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar Configuracoes"}
        </Button>
      </div>
    </div>
  )
}
