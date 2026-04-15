import { z } from "zod"
import { PaymentMethod } from "@/types"

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional().nullable(),
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
  category: z.string().min(1, "Categoria é obrigatória"),
  available: z.boolean().default(true),
  prepTime: z.coerce.number().int().min(0).optional().nullable(),
})

export type ProductInput = z.infer<typeof productSchema>

export const orderSchema = z.object({
  customerName: z.string().min(1, "Nome do cliente é obrigatório"),
  customerPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Produto é obrigatório"),
        quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1"),
        observations: z.string().optional().nullable(),
        addonIds: z.array(z.string()).optional().default([]),
      })
    )
    .min(1, "O pedido deve ter pelo menos um item"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  changeFor: z.coerce.number().optional().nullable(),
})

export type OrderInput = z.infer<typeof orderSchema>

export const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
})

export type CategoryInput = z.infer<typeof categorySchema>
