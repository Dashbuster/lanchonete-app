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
  GripVertical,
  Loader2,
  X,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
}

interface CategoryFormData {
  name: string
  description: string
  image: string | null
  order: number
  active: boolean
}

// ─── Mock Data ──────────────────────────────────────────────────────

const mockCategories: Category[] = [
  { id: "1", name: "Lanches", description: "Hamburgeres, sanduiches e wraps", image: null, order: 1, active: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "2", name: "Bebidas", description: "Refrigerantes, sucos e aguas", image: null, order: 2, active: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "3", name: "Porcoes", description: "Batata frita, onion rings e mais", image: null, order: 3, active: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "4", name: "Sobremesas", description: "Doces e sobremesas diversas", image: null, order: 4, active: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "5", name: "Combos", description: "Combos promocionais", image: null, order: 5, active: false, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
]

const emptyFormData: CategoryFormData = {
  name: "",
  description: "",
  image: null,
  order: 0,
  active: true,
}

// ─── Image Upload Inline Component ──────────────────────────────────

interface ImageUploadProps {
  value: string | null
  onChange: (value: string | null) => void
}

function ImageUpload({ value, onChange }: ImageUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      onChange(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-dark-300">Imagem</label>
      {value ? (
        <div className="relative w-fit">
          <img
            src={value}
            alt="Preview"
            className="w-32 h-32 rounded-lg object-cover border border-dark-600"
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
        <label className="flex flex-col items-center justify-center w-32 h-32 rounded-lg border-2 border-dashed border-dark-600 cursor-pointer hover:border-brand-500 transition-colors">
          <ImageIcon className="w-8 h-8 text-dark-400" />
          <span className="mt-2 text-xs text-dark-400">Upload</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────

function CategoriesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-36 rounded-lg bg-dark-600 animate-pulse" />
      <div className="rounded-xl border border-dark-600 bg-dark-800 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-dark-600 last:border-b-0" />
        ))}
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(emptyFormData)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/categories")
      if (res.ok) {
        const json = await res.json()
        setCategories(json)
      } else {
        setCategories(mockCategories)
      }
    } catch {
      setCategories(mockCategories)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const openNew = () => {
    setEditingCategory(null)
    setFormData({ ...emptyFormData, order: categories.length + 1 })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      image: category.image,
      order: category.order,
      active: category.active,
    })
    setErrors({})
    setModalOpen(true)
  }

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) errs.name = "Nome e obrigatoria"
    if (formData.name.trim().length < 2) errs.name = "Nome deve ter pelo menos 2 caracteres"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          await fetchCategories()
        } else {
          // Optimistic update for mock
          setCategories((prev) =>
            prev.map((c) =>
              c.id === editingCategory.id ? { ...c, ...formData } : c
            )
          )
        }
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          await fetchCategories()
        } else {
          // Optimistic update for mock
          const newCategory: Category = {
            id: String(Date.now()),
            ...formData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setCategories((prev) => [...prev, newCategory])
        }
      }
      setModalOpen(false)
      setFormData(emptyFormData)
      setEditingCategory(null)
    } catch {
      // Optimistic update fallback
      if (editingCategory) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id ? { ...c, ...formData } : c
          )
        )
      } else {
        const newCategory: Category = {
          id: String(Date.now()),
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setCategories((prev) => [...prev, newCategory])
      }
      setModalOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchCategories()
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== id))
      }
    } catch {
      setCategories((prev) => prev.filter((c) => c.id !== id))
    }
  }

  const handleToggleActive = async (category: Category) => {
    const updated = { ...category, active: !category.active }
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !category.active }),
      })
      if (res.ok) {
        fetchCategories()
      } else {
        setCategories((prev) =>
          prev.map((c) => (c.id === category.id ? updated : c))
        )
      }
    } catch {
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? updated : c))
      )
    }
  }

  if (loading) {
    return <CategoriesSkeleton />
  }

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorias</h1>
          <p className="text-sm text-dark-300 mt-1">Gerencie as categorias do cardapio</p>
        </div>
        <Button size="md" onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-dark-600 bg-dark-800 overflow-hidden">
        {sortedCategories.length === 0 ? (
          <div className="py-12 text-center text-dark-300">
            Nenhuma categoria cadastrada. Clique em &quot;Nova Categoria&quot; para comecar.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Ordem</TableHead>
                <TableHead>Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Descricao</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCategories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <GripVertical className="w-4 h-4 text-dark-400 cursor-move" />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-dark-300">{cat.order}</span>
                  </TableCell>
                  <TableCell>
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-10 h-10 rounded-lg object-cover border border-dark-600"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-dark-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-white">{cat.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p className="text-sm text-dark-300 truncate max-w-[200px]">
                      {cat.description || "--"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={cat.active}
                      onCheckedChange={() => handleToggleActive(cat)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(cat)}
                        className="gap-1"
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(cat.id)}
                        className="gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Category Dialog */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingCategory ? "Editar Categoria" : "Nova Categoria"}
        description={editingCategory ? "Atualize os dados da categoria" : "Preencha os dados da nova categoria"}
        footer={
          <div className="flex gap-2 sm:justify-end w-full">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingCategory ? "Salvar" : "Criar"}
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
              placeholder="Ex: Lanches"
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
              placeholder="Descricao da categoria (opcional)"
              rows={2}
            />
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Ordem</label>
            <Input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
              className="w-24"
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-3">
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
            />
            <span className="text-sm text-dark-300">Ativa</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
