import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireAdminAuth } from "@/lib/api-auth"

interface Params {
  params: { id: string }
}

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.coerce.number().positive().optional(),
  costPrice: z.coerce.number().min(0).optional(),
  categoryId: z.string().min(1).optional(),
  image: z.string().nullable().optional(),
  available: z.boolean().optional(),
  prepTime: z.coerce.number().int().min(0).nullable().optional(),
})

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
      },
      include: {
        category: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Erro ao buscar produto" },
      { status: 500 }
    )
  }
}

async function updateProduct(request: NextRequest, { params }: Params) {
  try {
    const existing = await prisma.product.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = productUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      )
    }

    const updateData = validation.data

    if (updateData.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: {
          id: updateData.categoryId,
        },
      })

      if (!categoryExists) {
        return NextResponse.json(
          { error: "Categoria não encontrada" },
          { status: 404 }
        )
      }
    }

    const product = await prisma.product.update({
      where: {
        id: params.id,
      },
      data: {
        ...(updateData.name !== undefined ? { name: updateData.name } : {}),
        ...(updateData.description !== undefined
          ? { description: updateData.description || null }
          : {}),
        ...(updateData.price !== undefined ? { price: updateData.price } : {}),
        ...(updateData.costPrice !== undefined
          ? { costPrice: updateData.costPrice }
          : {}),
        ...(updateData.categoryId !== undefined
          ? { categoryId: updateData.categoryId }
          : {}),
        ...(updateData.image !== undefined ? { image: updateData.image || null } : {}),
        ...(updateData.available !== undefined
          ? { available: updateData.available }
          : {}),
        ...(updateData.prepTime !== undefined
          ? { prepTime: updateData.prepTime ?? 0 }
          : {}),
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, context: Params) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  return updateProduct(request, context)
}

export async function PUT(request: NextRequest, context: Params) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  return updateProduct(request, context)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  try {
    const existing = await prisma.product.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    await prisma.addon.deleteMany({
      where: {
        group: {
          productId: params.id,
        },
      },
    })

    await prisma.addonGroup.deleteMany({
      where: {
        productId: params.id,
      },
    })

    await prisma.product.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ message: "Produto excluído com sucesso" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Erro ao excluir produto" },
      { status: 500 }
    )
  }
}
