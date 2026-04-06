// ─── Enums ───────────────────────────────────────────────────────────

export enum Role {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  CASHIER = "CASHIER",
  CLIENT = "CLIENT",
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY = "READY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
  CASH = "CASH",
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  PIX = "PIX",
  ON_SITE = "ON_SITE",
  MERCADO_PAGO = "MERCADO_PAGO",
}

// ─── Interfaces ──────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  password: string | null;
  role: Role;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  categoryId: string;
  category?: Category;
  available: boolean;
  prepTime: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddonGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  required: boolean;
  productId: string;
  product?: Product;
  createdAt: Date;
  updatedAt: Date;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  available: boolean;
  addonGroupId: string;
  addonGroup?: AddonGroup;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  order?: Order;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  observations: string | null;
  addons: Addon[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  number: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paid: boolean;
  paymentId: string | null;
  changeFor: number | null;
  notes: string | null;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}
