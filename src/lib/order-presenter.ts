import type { Order, OrderItem, Product } from "@prisma/client"

type OrderWithItems = Order & {
  items: OrderItem[]
}

export async function attachProductsToOrders(
  orders: OrderWithItems[],
  getProducts: (ids: string[]) => Promise<Pick<Product, "id" | "name" | "image">[]>
) {
  const productIds = Array.from(
    new Set(
      orders.flatMap((order) => order.items.map((item) => item.productId))
    )
  )

  const products = await getProducts(productIds)
  const productsById = new Map(products.map((product) => [product.id, product]))

  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      product: productsById.get(item.productId) || null,
    })),
  }))
}
