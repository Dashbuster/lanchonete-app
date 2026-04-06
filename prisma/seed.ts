import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Users
  const adminPassword = await hash("admin123", 10)
  const managerPassword = await hash("gerente123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@lanchonete.com" },
    update: {},
    create: {
      email: "admin@lanchonete.com",
      password: adminPassword,
      name: "Administrador",
      role: "ADMIN",
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: "gerente@lanchonete.com" },
    update: {},
    create: {
      email: "gerente@lanchonete.com",
      password: managerPassword,
      name: "Gerente",
      role: "MANAGER",
    },
  })

  const cashier = await prisma.user.upsert({
    where: { email: "caixa@lanchonete.com" },
    update: {},
    create: {
      email: "caixa@lanchonete.com",
      password: managerPassword,
      name: "Caixa",
      role: "CASHIER",
    },
  })

  console.log("  Users created: admin, gerente, caixa")

  // Categories
  const lanches = await prisma.category.upsert({
    where: { name: "Lanches" },
    update: {},
    create: { name: "Lanches", description: "Os melhores lanches da cidade", order: 1, active: true },
  })

  const bebidas = await prisma.category.upsert({
    where: { name: "Bebidas" },
    update: {},
    create: { name: "Bebidas", description: "Bebidas geladas", order: 2, active: true },
  })

  const porcoes = await prisma.category.upsert({
    where: { name: "Porcoes" },
    update: {},
    create: { name: "Porcoes", description: "Porcoes para compartilhar", order: 3, active: true },
  })

  const sobremesas = await prisma.category.upsert({
    where: { name: "Sobremesas" },
    update: {},
    create: { name: "Sobremesas", description: "Para adoçar o dia", order: 4, active: true },
  })

  const combos = await prisma.category.upsert({
    where: { name: "Combos" },
    update: {},
    create: { name: "Combos", description: "Lanche + Batata + Bebida", order: 5, active: true },
  })

  console.log("  Categories created: Lanches, Bebidas, Porcoes, Sobremesas, Combos")

  // Products
  const products = [
    { name: "X-Burguer", description: "Hamburguer artesanal 180g, queijo, alface, tomate e molho especial", price: 22.9, categoryId: lanches.id },
    { name: "X-Salada", description: "Hamburguer 180g, queijo, alface, tomate, cebola e milho", price: 24.9, categoryId: lanches.id },
    { name: "X-Bacon", description: "Hamburguer artesanal 180g, bacon crocante, queijo cheddar e molho barbecue", price: 28.9, categoryId: lanches.id },
    { name: "X-Frango", description: "Hamburguer de frango grelhado, alface, tomate e maionese verde", price: 23.9, categoryId: lanches.id },
    { name: "Smash Burger Duplo", description: "Dois smash burgers 90g, queijo americano, picles e molho da casa", price: 32.9, categoryId: lanches.id },
    { name: "Coca-Cola 350ml", description: "Coca-Cola lata gelada", price: 6.9, categoryId: bebidas.id },
    { name: "Guarana Antarctica 350ml", description: "Guarana Antarctica lata gelada", price: 6.9, categoryId: bebidas.id },
    { name: "Suco Natural 500ml", description: "Suco de laranja, limao ou maracuja feito na hora", price: 12.9, categoryId: bebidas.id },
    { name: "Agua Mineral 500ml", description: "Agua mineral sem ou com gas", price: 4.9, categoryId: bebidas.id },
    { name: "Batata Frita P", description: "Porcao de batata frita crocante - porcao pequena", price: 18.9, categoryId: porcoes.id },
    { name: "Batata Frita G", description: "Porcao de batata frita crocante - porcao grande", price: 28.9, categoryId: porcoes.id },
    { name: "Onion Rings", description: "Argolas de cebola empanadas e fritas - 12 unidades", price: 24.9, categoryId: porcoes.id },
    { name: "Nuggets 6un", description: "6 nuggets crocantes", price: 14.9, categoryId: porcoes.id },
    { name: "Brownie", description: "Brownie de chocolate com nozes", price: 14.9, categoryId: sobremesas.id },
    { name: "Pudim", description: "Pudim de leite condensado caseiro", price: 16.9, categoryId: sobremesas.id },
    { name: "Churros", description: "Churros recheado com doce de leite", price: 9.9, categoryId: sobremesas.id },
    { name: "Combo X-Burguer", description: "X-Burguer + Batata Frita P + Coca-Cola 350ml", price: 35.9, categoryId: combos.id },
    { name: "Combo Smash", description: "Smash Burger Duplo + Batata Frita P + Suco Natural 500ml", price: 48.9, categoryId: combos.id },
    { name: "Combo X-Bacon", description: "X-Bacon + Batata Frita P + Coca-Cola 350ml", price: 39.9, categoryId: combos.id },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: {
        ...product,
        available: true,
        prepTime: product.categoryId === lanches.id || product.categoryId === combos.id ? Math.floor(Math.random() * 10 + 15) : 5,
      },
    })
  }

  console.log(`  ${products.length} products created`)

  // Addon Groups
  const paoGroup = await prisma.addongroup.create({
    data: {
      name: "Escolha o Pao",
      minSelect: 1,
      maxSelect: 1,
      required: true,
    },
  })

  const adicionaisGroup = await prisma.addongroup.create({
    data: {
      name: "Adicionais",
      minSelect: 0,
      maxSelect: 5,
      required: false,
    },
  })

  const tamanhoBebidaGroup = await prisma.addongroup.create({
    data: {
      name: "Tamanho da Bebida",
      minSelect: 1,
      maxSelect: 1,
      required: false,
    },
  })

  // Addons
  const paoAddons = [
    { name: "Pao Tradicional", price: 0, groupId: paoGroup.id },
    { name: "Pao Australiano", price: 3.0, groupId: paoGroup.id },
    { name: "Pao Brioche", price: 2.5, groupId: paoGroup.id },
    { name: "Pao Vegano", price: 3.5, groupId: paoGroup.id },
  ]

  const adicionalAddons = [
    { name: "Bacon Extra", price: 5.0, groupId: adicionaisGroup.id },
    { name: "Queijo Extra", price: 4.0, groupId: adicionaisGroup.id },
    { name: "Ovo Extra", price: 3.5, groupId: adicionaisGroup.id },
    { name: "Hamburguer Extra", price: 8.0, groupId: adicionaisGroup.id },
  ]

  const bebidaAddons = [
    { name: "300ml (Lata)", price: 0, groupId: tamanhoBebidaGroup.id },
    { name: "500ml", price: 4.0, groupId: tamanhoBebidaGroup.id },
    { name: "1L", price: 8.0, groupId: tamanhoBebidaGroup.id },
  ]

  for (const addon of [...paoAddons, ...adicionalAddons, ...bebidaAddons]) {
    await prisma.addon.create({ data: addon })
  }

  console.log(`  3 addon groups with 13 addons created`)

  // Settings
  const settings = [
    { key: "store_name", value: "Lanchonete" },
    { key: "store_description", value: "Os melhores lanches artesanais da cidade!" },
    { key: "delivery_fee", value: "5.00" },
    { key: "delivery_radius_km", value: "5" },
    { key: "min_order_value", value: "15.00" },
    { key: "accepts_pickup", value: "true" },
    { key: "whatsapp", value: "(11) 99999-9999" },
    { key: "instagram", value: "@lanchonete" },
    { key: "store_open", value: "true" },
    { key: "payment_pix", value: "true" },
    { key: "payment_credit_card", value: "true" },
    { key: "payment_debit_card", value: "true" },
    { key: "payment_cash", value: "true" },
    { key: "payment_on_site", value: "true" },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log("  Settings created")
  console.log("\nSeed completed successfully!\n")
  console.log("  Admin:     admin@lanchonete.com / admin123")
  console.log("  Gerente:   gerente@lanchonete.com / gerente123")
  console.log("  Caixa:     caixa@lanchonete.com / gerente123")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
