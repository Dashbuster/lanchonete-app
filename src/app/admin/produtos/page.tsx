"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Camera,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import { Switch } from "@/components/ui/Switch"
import { Textarea } from "@/components/ui/Textarea"

interface Category {
  id: string
  name: string
  active: boolean
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  costPrice: number
  image: string | null
  category: { id: string; name: string } | null
  available: boolean
  prepTime: number | null
}

interface ProductFormData {
  name: string
  description: string
  price: string
  costPrice: string
  categoryId: string
  image: string | null
  available: boolean
  prepTime: string
}

const emptyForm: ProductFormData = {
  name: "",
  description: "",
  price: "",
  costPrice: "",
  categoryId: "",
  image: null,
  available: true,
  prepTime: "",
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function loadData() {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ])

      if (productsResponse.ok) {
        setProducts(await productsResponse.json())
      }

      if (categoriesResponse.ok) {
        setCategories(await categoriesResponse.json())
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return products
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.category?.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      )
    })
  }, [products, search])

  function openCreateModal() {
    setEditingProduct(null)
    setFormData({ ...emptyForm })
    setModalOpen(true)
  }

  function openEditModal(product: Product) {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      costPrice: String(product.costPrice ?? 0),
      categoryId: product.category?.id || "",
      image: product.image,
      available: product.available,
      prepTime: product.prepTime ? String(product.prepTime) : "",
    })
    setModalOpen(true)
  }

  async function handleImageUpload(file: File) {
    setUploading(true)

    try {
      const form = new FormData()
      form.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar imagem.")
      }

      setFormData((current) => ({
        ...current,
        image: data.url,
      }))
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao enviar imagem.")
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (!formData.name.trim()) {
      alert("Informe o nome do produto.")
      return
    }

    if (!formData.categoryId) {
      alert("Selecione a categoria.")
      return
    }

    if (!formData.price || Number(formData.price) <= 0) {
      alert("Informe um preço válido.")
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice || 0),
        categoryId: formData.categoryId,
        image: formData.image,
        available: formData.available,
        prepTime: formData.prepTime ? Number(formData.prepTime) : 0,
      }

      const response = await fetch(
        editingProduct ? `/api/products/${editingProduct.id}` : "/api/products",
        {
          method: editingProduct ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar produto.")
      }

      setModalOpen(false)
      setFormData({ ...emptyForm })
      setEditingProduct(null)
      await loadData()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao salvar produto.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este produto?")) {
      return
    }

    try {
      await fetch(`/api/products/${id}`, {
        method: "DELETE",
      })
      await loadData()
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
    }
  }

  async function handleToggleAvailability(product: Product) {
    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          available: !product.available,
        }),
      })

      await loadData()
    } catch (error) {
      console.error("Erro ao atualizar disponibilidade:", error)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
              Big Night
            </p>
            <h1 className="mt-2 text-4xl font-black text-white">
              Produtos do cardápio
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-dark-100">
              Cadastre novos lanches, altere preços, troque imagens e ligue ou
              desligue a disponibilidade sem complicação.
            </p>
          </div>

          <Button className="gap-2" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Novo produto
          </Button>
        </div>

        <div className="mt-6 relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-300" />
          <Input
            className="pl-11"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou categoria..."
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <article
            key={product.id}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"
          >
            <div className="flex gap-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="h-7 w-7 text-dark-300" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-bold text-white">{product.name}</p>
                    <p className="mt-1 text-sm text-dark-200">
                      {product.category?.name || "Sem categoria"}
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white">
                    R$ {Number(product.price).toFixed(2).replace(".", ",")}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-7 text-dark-200">
                  {product.description || "Sem descrição cadastrada."}
                </p>

                <div className="mt-2 text-xs text-dark-300">
                  Custo: R$ {Number(product.costPrice || 0).toFixed(2).replace(".", ",")}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={product.available}
                      onCheckedChange={() => handleToggleAvailability(product)}
                    />
                    <span className="text-sm text-dark-100">
                      {product.available ? "Disponível" : "Indisponível"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-2"
                      onClick={() => openEditModal(product)}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      className="gap-2"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingProduct ? "Editar produto" : "Novo produto"}
        description="Preencha apenas o necessário para o produto aparecer no cardápio."
        footer={
          <div className="flex w-full gap-2 sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || uploading}>
              {submitting ? "Salvando..." : "Salvar produto"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Imagem do produto
            </label>

            <div className="flex items-center gap-4">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-dark-300" />
                )}
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white">
                <Upload className="h-4 w-4" />
                {uploading ? "Enviando..." : "Escolher imagem"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      handleImageUpload(file)
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Nome do produto
            </label>
            <Input
              value={formData.name}
              onChange={(event) =>
                setFormData((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ex.: Big Bacon"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white">
                Preço
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, price: event.target.value }))
                }
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-white">
                Custo do produto
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    costPrice: event.target.value,
                  }))
                }
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-white">
                Tempo de preparo
              </label>
              <Input
                type="number"
                value={formData.prepTime}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, prepTime: event.target.value }))
                }
                placeholder="Ex.: 15"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Categoria
            </label>
            <select
              value={formData.categoryId}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  categoryId: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="" className="text-black">
                Selecione a categoria
              </option>
              {categories
                .filter((category) => category.active)
                .map((category) => (
                  <option key={category.id} value={category.id} className="text-black">
                    {category.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Descrição
            </label>
            <Textarea
              value={formData.description}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Descreva rapidamente o lanche."
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={formData.available}
              onCheckedChange={(checked) =>
                setFormData((current) => ({ ...current, available: checked }))
              }
            />
            <span className="text-sm text-dark-100">
              Produto disponível para venda
            </span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
