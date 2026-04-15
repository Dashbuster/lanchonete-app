import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireAdminAuth } from "@/lib/api-auth"

const productCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().nullable().optional(),
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
  costPrice: z.coerce.number().min(0, "Custo deve ser zero ou maior"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  image: z.string().nullable().optional(),
  available: z.boolean().default(true),
  prepTime: z.coerce.number().int().min(0).nullable().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const availableParam = searchParams.get("available")

    const where: Record<string, unknown> = {}

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (availableParam) {
      where.available = availableParam === "true"
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    const groups = await prisma.addonGroup.findMany({
      where: {
        productId: {
          in: products.map((product) => product.id),
        },
      },
      include: {
        addons: true,
      },
    })

    const groupsByProduct = groups.reduce<Record<string, typeof groups>>((acc, group) => {
      if (!group.productId) {
        return acc
      }

      acc[group.productId] ||= []
      acc[group.productId].push(group)
      return acc
    }, {})

    return NextResponse.json(
      products.map((product) => ({
        ...product,
        addonGroups: (groupsByProduct[product.id] || []).map((group) => ({
          id: group.id,
          name: group.name,
          minSelections: group.minSelect,
          maxSelections: group.maxSelect,
          required: group.required,
          addons: group.addons.map((addon) => ({
            id: addon.id,
            name: addon.name,
            price: Number(addon.price),
          })),
        })),
        addons: (groupsByProduct[product.id] || []).flatMap((group) => group.addons),
      }))
    )
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  try {
    const body = await request.json()
    const validation = productCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      name,
      description,
      price,
      costPrice,
      categoryId,
      image,
      available,
      prepTime,
    } =
      validation.data

    const categoryExists = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    })

    if (!categoryExists) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price,
        costPrice,
        image: image || null,
        categoryId,
        available,
        prepTime: prepTime ?? 0,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    )
  }
}
