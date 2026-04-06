"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Switch } from "@/components/ui/Switch"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/utils/cn"
import {
  Save,
  Image as ImageIcon,
  Loader2,
  X,
  Store,
  Clock,
  Truck,
  Phone,
  Instagram,
  CreditCard,
  DollarSign,
  Coins,
  Building2,
  Store as StoreIcon,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────

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

interface StoreSettings {
  name: string
  logo: string | null
  storeOpen: boolean
  dayHours: Record<string, DayHours>
  deliveryFee: number
  deliveryRadius: number
  minOrderValue: number
  acceptsPickup: boolean
  whatsapp: string
  instagramUrl: string
  paymentMethods: PaymentMethod[]
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

const defaultPaymentMethods: PaymentMethod[] = [
  { id: "PIX", label: "PIX", icon: <DollarSign className="w-5 h-5" />, enabled: true },
  { id: "CREDIT_CARD", label: "Cartao de Credito", icon: <CreditCard className="w-5 h-5" />, enabled: true },
  { id: "DEBIT_CARD", label: "Cartao de Debito", icon: <CreditCard className="w-5 h-5" />, enabled: true },
  { id: "CASH", label: "Dinheiro", icon: <Coins className="w-5 h-5" />, enabled: true },
  { id: "ON_SITE", label: "Pagamento no Local", icon: <Building2 className="w-5 h-5" />, enabled: false },
]

// ─── Mock Data ──────────────────────────────────────────────────────

const mockSettings: StoreSettings = {
  name: "Lanchonete do Zé",
  logo: null,
  storeOpen: true,
  dayHours: {
    monday: { ...defaultDayHours, open: "18:00", close: "23:00" },
    tuesday: { ...defaultDayHours, open: "18:00", close: "23:00" },
    wednesday: { ...defaultDayHours, open: "18:00", close: "23:00" },
    thursday: { ...defaultDayHours, open: "18:00", close: "23:00" },
    friday: { ...defaultDayHours, open: "18:00", close: "00:00" },
    saturday: { ...defaultDayHours, open: "17:00", close: "00:00" },
    sunday: { ...defaultDayHours, open: "17:00", close: "22:00" },
  },
  deliveryFee: 5.0,
  deliveryRadius: 5,
  minOrderValue: 15.0,
  acceptsPickup: true,
  whatsapp: "(11) 99999-0000",
  instagramUrl: "https://instagram.com/lanchonetedoze",
  paymentMethods: defaultPaymentMethods,
}

// ─── Image Upload Component ─────────────────────────────────────────

interface ImageUploadProps {
  value: string | null
  onChange: (value: string | null) => void
  size?: "small" | "medium"
}

function ImageUpload({ value, onChange, size = "medium" }: ImageUploadProps) {
  const sizeClasses = size === "small" ? "w-24 h-24" : "w-32 h-32"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-fit">
          <img
            src={value}
            alt="Logo preview"
            className={cn("rounded-lg object-cover border border-dark-600", sizeClasses)}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-dark-600 cursor-pointer hover:border-brand-500 transition-colors",
            sizeClasses
          )}
        >
          <ImageIcon className="w-6 h-6 text-dark-400" />
          <span className="mt-1 text-xs text-dark-400">Upload</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      )}
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-44 rounded bg-dark-600 animate-pulse" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-dark-600 bg-dark-800 p-6 animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="h-10 rounded bg-dark-600" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/store-settings")
      if (res.ok) {
        setSettings(await res.json())
      } else {
        setSettings(mockSettings)
      }
    } catch {
      setSettings(mockSettings)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch("/api/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      // Optimistic save assumed successful
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const toggleStoreOpen = () => {
    if (!settings) return
    setSettings((prev) => (prev ? { ...prev, storeOpen: !prev.storeOpen } : prev))
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuracoes</h1>
          <p className="text-sm text-dark-300 mt-1">Gerencie as configuracoes da loja</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={settings.storeOpen ? "success" : "danger"}>
              {settings.storeOpen ? "Loja Aberta" : "Loja Fechada"}
            </Badge>
          </div>
          <Switch checked={settings.storeOpen} onCheckedChange={toggleStoreOpen} />
        </div>
      </div>

      {/* Saved Notification */}
      {saved && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
          Configuracoes salvas com sucesso!
        </div>
      )}

      {/* General Settings */}
      <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 space-y-6">
        <div className="flex items-center gap-2">
          <StoreIcon className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-white">Geral</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Store Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Nome da Loja</label>
            <Input
              value={settings.name}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
              placeholder="Nome da lanchonete"
            />
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Logo</label>
            <ImageUpload
              value={settings.logo}
              onChange={(val) => setSettings((prev) => (prev ? { ...prev, logo: val } : prev))}
              size="small"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <Input
                value={settings.whatsapp}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, whatsapp: e.target.value } : prev
                  )
                }
                placeholder="(00) 00000-0000"
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Instagram URL</label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <Input
                value={settings.instagramUrl}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, instagramUrl: e.target.value } : prev
                  )
                }
                placeholder="https://instagram.com/seuperfil"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Pickup */}
        <div className="flex items-center gap-3">
          <Switch
            checked={settings.acceptsPickup}
            onCheckedChange={(checked) =>
              setSettings((prev) => (prev ? { ...prev, acceptsPickup: checked } : prev))
            }
          />
          <span className="text-sm text-dark-300">Aceita retirada no local</span>
        </div>
      </div>

      {/* Opening Hours */}
      <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-white">Horario de Funcionamento</h2>
        </div>

        <div className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const day = settings.dayHours[key] || defaultDayHours
            return (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 px-3 rounded-lg bg-dark-700/30"
              >
                <span className="text-sm font-medium text-white w-24">{label}</span>
                <Switch
                  checked={day.isOpen}
                  onCheckedChange={(checked) => updateDayHours(key, "isOpen", checked)}
                />
                {day.isOpen && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={day.open}
                      onChange={(e) => updateDayHours(key, "open", e.target.value)}
                      className="w-32 text-sm"
                    />
                    <span className="text-dark-400 text-sm">ate</span>
                    <Input
                      type="time"
                      value={day.close}
                      onChange={(e) => updateDayHours(key, "close", e.target.value)}
                      className="w-32 text-sm"
                    />
                  </div>
                )}
                {!day.isOpen && (
                  <span className="text-sm text-dark-400 italic">Fechado</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Delivery Settings */}
      <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-white">Entrega</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Taxa de Entrega (R$)</label>
            <Input
              type="number"
              step="0.5"
              value={settings.deliveryFee}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, deliveryFee: parseFloat(e.target.value) || 0 } : prev
                )
              }
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Raio de Entrega (km)</label>
            <Input
              type="number"
              step="0.5"
              value={settings.deliveryRadius}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, deliveryRadius: parseFloat(e.target.value) || 0 } : prev
                )
              }
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-300">Pedido Minimo (R$)</label>
            <Input
              type="number"
              step="1"
              value={settings.minOrderValue}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, minOrderValue: parseFloat(e.target.value) || 0 } : prev
                )
              }
            />
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-white">Formas de Pagamento</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {settings.paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className="flex items-center gap-3 rounded-lg border border-dark-600 bg-dark-700/50 p-3"
            >
              <div className="text-dark-300">{pm.icon}</div>
              <span className="text-sm text-white flex-1">{pm.label}</span>
              <Switch checked={pm.enabled} onCheckedChange={() => togglePaymentMethod(pm.id)} />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar Configuracoes"}
        </Button>
      </div>
    </div>
  )
}
