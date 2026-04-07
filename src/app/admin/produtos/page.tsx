"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Switch } from "@/components/ui/Switch"
import { Modal } from "@/components/ui/Modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { cn } from "@/utils/cn"
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  X,
  Loader2,
  PlusCircle,
  MinusCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
  active: boolean
}

interface Addon {
  id: string
  name: string
  price: number
}

interface AddonGroup {
  id: string
  name: string
  minSelections: number
  maxSelections: number
  required: boolean
  addons: Addon[]
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  category: { id: string; name: string } | null
  available: boolean
  prepTime: number | null
  addonGroups: AddonGroup[]
  createdAt: string
  updatedAt: string
}

interface AddonGroupFormData {
  id: string
  name: string
  minSelections: number
  maxSelections: number
  required: boolean
  addons: Addon[]
}

interface ProductFormData {
  name: string
  description: string
  price: string
  categoryId: string
  image: string | null
  available: boolean
  prepTime: string
  addonGroups: AddonGroupFormData[]
}

// ─── Mock Data ──────────────────────────────────────────────────────

const mockCategories: Category[] = [
  { id: "1", name: "Lanches", active: true },
  { id: "2", name: "Bebidas", active: true },
  { id: "3", name: "Porcoes", active: true },
  { id: "4", name: "Sobremesas", active: true },
]

const mockProducts: Product[] = [
  { id: "1", name: "X-Bacon", description: "Hamburguer artesanal com bacon crocante", price: 18.9, image: null, category: { id: "1", name: "Lanches" }, available: true, prepTime: 15, addonGroups: [{ id: "g1", name: "Adicionais", minSelections: 0, maxSelections: 3, required: false, addons: [{ id: "a1", name: "Bacon extra", price: 3.0 }, { id: "a2", name: "Queijo cheddar", price: 2.5 }] }], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "2", name: "X-Salada", description: "Hamburguer com alface, tomate e molho especial", price: 15.5, image: null, category: { id: "1", name: "Lanches" }, available: true, prepTime: 12, addonGroups: [], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "3", name: "Coca-Cola 350ml", description: "Lata", price: 6.0, image: null, category: { id: "2", name: "Bebidas" }, available: true, prepTime: 2, addonGroups: [], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "4", name: "Batata Frita P", description: "Porcao pequena de batata frita", price: 13.0, image: null, category: { id: "3", name: "Porcoes" }, available: true, prepTime: 10, addonGroups: [], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "5", name: "X-Tudo", description: "O lanche mais completo da casa", price: 24.0, image: null, category: { id: "1", name: "Lanches" }, available: true, prepTime: 20, addonGroups: [{ id: "g2", name: "Extras", minSelections: 0, maxSelections: 5, required: false, addons: [{ id: "a3", name: "Cheddar extra", price: 3.5 }, { id: "a4", name: "Bacon extra", price: 3.0 }, { id: "a5", name: "Ovo", price: 2.5 }] }], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "6", name: "Acai 300ml", description: "Acai na caneca com granola e banana", price: 22.0, image: null, category: { id: "4", name: "Sobremesas" }, available: false, prepTime: 8, addonGroups: [], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
]

const emptyAddonGroup: Omit<AddonGroupFormData, "id"> = {
  name: "",
  minSelections: 0,
  maxSelections: 1,
  required: false,
  addons: [],
}

const emptyFormData: ProductFormData = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  image: null,
  available: true,
  prepTime: "",
  addonGroups: [],
}

// ─── Image Upload Component ─────────────────────────────────────────

interface ImageUploadProps {
  value: string | null
  onChange: (value: string | null) => void
}

function ImageUpload({ value, onChange }: ImageUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-dark-300 mb-1">Imagem do Produto</label>
      {value ? (
        <div className="relative w-fit">
          <img
            src={value}
            alt="Preview"
            className="w-40 h-40 rounded-lg object-cover border border-dark-600"
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
        <label className="flex flex-col items-center justify-center w-40 h-40 rounded-lg border-2 border-dashed border-dark-600 cursor-pointer hover:border-brand-500 transition-colors">
          <ImageIcon className="w-8 h-8 text-dark-400" />
          <span className="mt-2 text-xs text-dark-400">Upload imagem</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      )}
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────

function ProductsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-36 rounded-lg bg-dark-600 animate-pulse" />
      <div className="rounded-xl border border-dark-600 bg-dark-800 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-dark-600 last:border-b-0" />
        ))}
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [catsRes, prodsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products"),
      ])
      if (catsRes.ok) setCategories(await catsRes.json())
      else setCategories(mockCategories)

      if (prodsRes.ok) setProducts(await prodsRes.json())
      else setProducts(mockProducts)
    } catch {
      setCategories(mockCategories)
      setProducts(mockProducts)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openNew = () => {
    setEditingProduct(null)
    setFormData({ ...emptyFormData })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      categoryId: product.category?.id || "",
      image: product.image,
      available: product.available,
      prepTime: product.prepTime ? String(product.prepTime) : "",
      addonGroups: product.addonGroups.map((g) => ({ ...g })),
    })
    setErrors({})
    setModalOpen(true)
  }

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) errs.name = "Nome e obrigatoria"
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0)
      errs.price = "Preco deve ser maior que zero"
    if (!formData.categoryId) errs.categoryId = "Selecione uma categoria"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    const payload = {
      ...formData,
      price: Number(formData.price),
      prepTime: formData.prepTime ? Number(formData.prepTime) : null,
    }
    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          fetchData()
        } else {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === editingProduct.id
                ? { ...p, ...payload }
                : p
            )
          )
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          fetchData()
        } else {
          setProducts((prev) => [
            ...prev,
            { ...payload, id: String(Date.now()), addonGroups: payload.addonGroups, category: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Product,
          ])
        }
      }
      setModalOpen(false)
      setFormData(emptyFormData)
      setEditingProduct(null)
    } catch {
      setProducts((prev) =>
        editingProduct
          ? prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p))
          : [...prev, { ...payload, id: String(Date.now()), addonGroups: payload.addonGroups, category: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Product]
      )
      setModalOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (res.ok) fetchData()
      else setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const handleToggleAvailable = async (product: Product) => {
    const updated = { ...product, available: !product.available }
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !product.available }),
      })
      if (res.ok) fetchData()
      else setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)))
    } catch {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)))
    }
  }

  const handleBulkUnavailable = async (categoryId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.category?.id === categoryId ? { ...p, available: false } : p))
    )
  }

  // ─── Addon Group Management ─────────────────────────────────────

  const addAddonGroup = () => {
    const id = `group-${Date.now()}`
    setFormData((prev) => ({
      ...prev,
      addonGroups: [...prev.addonGroups, { ...emptyAddonGroup, id, addons: [] }],
    }))
  }

  const removeAddonGroup = (groupIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      addonGroups: prev.addonGroups.filter((_, i) => i !== groupIndex),
    }))
  }

  const updateAddonGroup = (groupIndex: number, field: string, value: unknown) => {
    setFormData((prev) => {
      const groups = [...prev.addonGroups]
      groups[groupIndex] = { ...groups[groupIndex], [field]: value } as AddonGroupFormData
      return { ...prev, addonGroups: groups }
    })
  }

  const addAddon = (groupIndex: number) => {
    setFormData((prev) => {
      const groups = [...prev.addonGroups]
      groups[groupIndex] = {
        ...groups[groupIndex],
        addons: [...groups[groupIndex].addons, { id: `addon-${Date.now()}`, name: "", price: 0 }],
      }
      return { ...prev, addonGroups: groups }
    })
  }

  const removeAddon = (groupIndex: number, addonIndex: number) => {
    setFormData((prev) => {
      const groups = [...prev.addonGroups]
      groups[groupIndex] = {
        ...groups[groupIndex],
        addons: groups[groupIndex].addons.filter((_, i) => i !== addonIndex),
      }
      return { ...prev, addonGroups: groups }
    })
  }

  const updateAddon = (groupIndex: number, addonIndex: number, field: string, value: string | number) => {
    setFormData((prev) => {
      const groups = [...prev.addonGroups]
      const addons = [...groups[groupIndex].addons]
      addons[addonIndex] = { ...addons[addonIndex], [field]: value }
      groups[groupIndex] = { ...groups[groupIndex], addons }
      return { ...prev, addonGroups: groups }
    })
  }

  if (loading) {
    return <ProductsSkeleton />
  }

  // Group products by category for bulk action
  const categoryProductCount: Record<string, number> = {}
  products.forEach((p) => {
    if (p.category) {
      categoryProductCount[p.category.id] = (categoryProductCount[p.category.id] || 0) + 1
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-sm text-dark-300 mt-1">Gerencie os produtos do cardapio</p>
        </div>
        <Button size="md" onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
      </div>

      {/* Bulk Actions */}
      {categories.map((cat) => {
        const count = categoryProductCount[cat.id] || 0
        if (count === 0) return null
        const allAvailable = products
          .filter((p) => p.category?.id === cat.id)
          .every((p) => p.available)
        return (
          <div key={cat.id} className="flex items-center gap-3">
            <span className="text-sm text-dark-300">{cat.name}:</span>
            <Button
              size="sm"
              variant="secondary"
              disabled={allAvailable}
              onClick={() => handleBulkUnavailable(cat.id)}
            >
              Tornar todos indisponiveis
            </Button>
          </div>
        )
      })}

      {/* Products Table */}
      <div className="rounded-xl border border-dark-600 bg-dark-800 overflow-hidden">
        {products.length === 0 ? (
          <div className="py-12 text-center text-dark-300">
            Nenhum produto cadastrado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead>Preco</TableHead>
                <TableHead className="hidden lg:table-cell">Prep. Tempo</TableHead>
                <TableHead>Disponivel</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover border border-dark-600"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-dark-600 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-dark-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-white">{product.name}</p>
                    <p className="text-xs text-dark-300 truncate max-w-[200px]">
                      {product.description?.slice(0, 50)}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-dark-300">{product.category?.name ?? "--"}</span>
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-dark-300">
                      {product.prepTime ? `${product.prepTime} min` : "--"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={product.available}
                      onCheckedChange={() => handleToggleAvailable(product)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(product)}
                        className="gap-1"
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="hidden lg:inline">Editar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(product.id)}
                        className="gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden lg:inline">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Product Dialog */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingProduct ? "Editar Produto" : "Novo Produto"}
        description={editingProduct ? "Atualize os dados do produto" : "Preencha os dados do novo produto"}
        footer={
          <div className="flex gap-2 sm:justify-end w-full">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingProduct ? "Salvar" : "Criar"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Image Upload */}
          <ImageUpload
            value={formData.image}
            onChange={(val) => setFormData((prev) => ({ ...prev, image: val }))}
          />

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Nome <span className="text-red-400">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: X-Bacon"
              className={cn(errors.name && "border-red-500 focus:ring-red-500")}
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Descricao</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Descricao do produto"
              rows={2}
            />
          </div>

          {/* Price and Prep Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Preco (R$) <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                className={cn(errors.price && "border-red-500 focus:ring-red-500")}
              />
              {errors.price && <p className="mt-1 text-xs text-red-400">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Tempo Preparo (min)
              </label>
              <Input
                type="number"
                value={formData.prepTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, prepTime: e.target.value }))}
                placeholder="Ex: 15"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Categoria <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
              className={cn(
                "w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors",
                errors.categoryId && "border-red-500 focus:ring-red-500"
              )}
            >
              <option value="">Selecione uma categoria</option>
              {categories
                .filter((c) => c.active)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-red-400">{errors.categoryId}</p>
            )}
          </div>

          {/* Available */}
          <div className="flex items-center gap-3">
            <Switch
              checked={formData.available}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, available: checked }))}
            />
            <span className="text-sm text-dark-300">Disponivel</span>
          </div>

          {/* Addon Groups */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-dark-300">
                Grupos de Adicionais
              </label>
              <Button size="sm" variant="secondary" onClick={addAddonGroup} className="gap-1">
                <PlusCircle className="w-4 h-4" />
                Adicionar Grupo
              </Button>
            </div>

            {formData.addonGroups.map((group, gIdx) => (
              <div key={group.id} className="rounded-lg border border-dark-600 bg-dark-700/50 p-4 space-y-3">
                {/* Group Header */}
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={group.name}
                    onChange={(e) => updateAddonGroup(gIdx, "name", e.target.value)}
                    placeholder="Nome do grupo (Ex: Adicionais)"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeAddonGroup(gIdx)}
                    className="text-dark-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Group Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Min. selecao</label>
                    <Input
                      type="number"
                      value={group.minSelections}
                      onChange={(e) => updateAddonGroup(gIdx, "minSelections", parseInt(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Max. selecao</label>
                    <Input
                      type="number"
                      value={group.maxSelections}
                      onChange={(e) => updateAddonGroup(gIdx, "maxSelections", parseInt(e.target.value) || 1)}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Switch
                      checked={group.required}
                      onCheckedChange={(checked) => updateAddonGroup(gIdx, "required", checked)}
                    />
                    <span className="text-xs text-dark-300">Obrigatorio</span>
                  </div>
                </div>

                {/* Addons in Group */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-dark-400">Adicionais</span>
                    <button
                      type="button"
                      onClick={() => addAddon(gIdx)}
                      className="text-xs text-brand-500 hover:text-brand-400 transition-colors"
                    >
                      + Adicional
                    </button>
                  </div>
                  {group.addons.length === 0 && (
                    <p className="text-xs text-dark-400 italic">Nenhum adicional. Adicione um acima.</p>
                  )}
                  {group.addons.map((addon, aIdx) => (
                    <div key={addon.id} className="flex items-center gap-2">
                      <Input
                        value={addon.name}
                        onChange={(e) => updateAddon(gIdx, aIdx, "name", e.target.value)}
                        placeholder="Nome"
                        className="flex-1 text-sm"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={addon.price}
                        onChange={(e) => updateAddon(gIdx, aIdx, "price", parseFloat(e.target.value) || 0)}
                        placeholder="Preco"
                        className="w-24 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeAddon(gIdx, aIdx)}
                        className="text-dark-300 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
