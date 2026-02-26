export interface Product {
  id: string
  name: string
  barcode: string
  stock: number
  cashPrice: number
  cardPrice: number
  category: string
}

export interface CartItem extends Product {
  quantity: number
}

export interface Seller {
  id: string
  name: string
}

export const sellers: Seller[] = [
  { id: "v1", name: "Ana" },
  { id: "v2", name: "Maria" },
  { id: "v3", name: "Laura" },
  { id: "v4", name: "Sofia" },
  { id: "v5", name: "Carmen" },
]

export interface Sale {
  id: string
  date: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  paymentMethod: "cash" | "card"
  seller?: string
}

export interface ConciliationItem {
  id: string
  name: string
  barcode: string
  quantity: number
  unitPrice: number
  total: number
  saleId: string
  date: string
  status: "pending" | "resolved" | "added_to_inventory"
}

export const products: Product[] = [
  { id: "1", name: "Coca Cola 600ml", barcode: "7501055300120", stock: 48, cashPrice: 18.0, cardPrice: 19.5, category: "Drinks" },
  { id: "2", name: "Sabritas Original 45g", barcode: "7501011115032", stock: 32, cashPrice: 22.0, cardPrice: 23.5, category: "Snacks" },
  { id: "3", name: "Bimbo White Bread", barcode: "7501030400011", stock: 15, cashPrice: 52.0, cardPrice: 54.0, category: "Bakery" },
  { id: "4", name: "Agua Ciel 1L", barcode: "7501055301455", stock: 60, cashPrice: 12.0, cardPrice: 13.0, category: "Drinks" },
  { id: "5", name: "Maruchan Shrimp", barcode: "7501030467123", stock: 40, cashPrice: 8.5, cardPrice: 9.5, category: "Food" },
  { id: "6", name: "Gansito Marinela", barcode: "7501030430216", stock: 25, cashPrice: 16.0, cardPrice: 17.0, category: "Snacks" },
  { id: "7", name: "Leche Lala 1L", barcode: "7501055360123", stock: 20, cashPrice: 28.0, cardPrice: 29.5, category: "Dairy" },
  { id: "8", name: "Nescafe Clasico 120g", barcode: "7501059200012", stock: 12, cashPrice: 85.0, cardPrice: 88.0, category: "Drinks" },
  { id: "9", name: "Huevo San Juan 12pz", barcode: "7501400101234", stock: 18, cashPrice: 45.0, cardPrice: 47.0, category: "Food" },
  { id: "10", name: "Papel Higienico Petalo 4pz", barcode: "7501019600123", stock: 22, cashPrice: 32.0, cardPrice: 34.0, category: "Hygiene" },
]

export const recentSales: Sale[] = [
  { id: "S001", date: "2026-02-24 09:15", items: [{ name: "Coca Cola 600ml", quantity: 2, price: 18 }, { name: "Sabritas Original 45g", quantity: 1, price: 22 }], total: 58, paymentMethod: "cash" },
  { id: "S002", date: "2026-02-24 09:42", items: [{ name: "Bimbo White Bread", quantity: 1, price: 52 }], total: 52, paymentMethod: "card" },
  { id: "S003", date: "2026-02-24 10:05", items: [{ name: "Agua Ciel 1L", quantity: 3, price: 12 }, { name: "Maruchan Shrimp", quantity: 2, price: 8.5 }], total: 53, paymentMethod: "cash" },
  { id: "S004", date: "2026-02-24 10:30", items: [{ name: "Nescafe Clasico 120g", quantity: 1, price: 85 }], total: 85, paymentMethod: "card" },
  { id: "S005", date: "2026-02-24 11:12", items: [{ name: "Leche Lala 1L", quantity: 2, price: 28 }, { name: "Huevo San Juan 12pz", quantity: 1, price: 45 }], total: 101, paymentMethod: "cash" },
  { id: "S006", date: "2026-02-24 11:45", items: [{ name: "Gansito Marinela", quantity: 3, price: 16 }, { name: "Coca Cola 600ml", quantity: 1, price: 18 }], total: 66, paymentMethod: "cash" },
  { id: "S007", date: "2026-02-24 12:20", items: [{ name: "Papel Higienico Petalo 4pz", quantity: 1, price: 32 }], total: 32, paymentMethod: "card" },
  { id: "S008", date: "2026-02-24 13:05", items: [{ name: "Sabritas Original 45g", quantity: 2, price: 22 }, { name: "Agua Ciel 1L", quantity: 2, price: 12 }], total: 68, paymentMethod: "cash" },
]

export const dailySalesData = [
  { day: "Mon", sales: 1240 },
  { day: "Tue", sales: 980 },
  { day: "Wed", sales: 1450 },
  { day: "Thu", sales: 1100 },
  { day: "Fri", sales: 1680 },
  { day: "Sat", sales: 2100 },
  { day: "Sun", sales: 890 },
]

export const topSellingProducts = [
  { name: "Coca Cola 600ml", sales: 145 },
  { name: "Agua Ciel 1L", sales: 120 },
  { name: "Sabritas Original", sales: 98 },
  { name: "Maruchan Shrimp", sales: 87 },
  { name: "Gansito Marinela", sales: 76 },
]

export interface ClosedDay {
  date: string
  totalSales: number
  totalCash: number
  totalCard: number
  numberOfSales: number
  profit: number
}

export const closedDaysHistory: ClosedDay[] = [
  { date: "2026-02-23", totalSales: 4820, totalCash: 2950, totalCard: 1870, numberOfSales: 34, profit: 1687 },
  { date: "2026-02-22", totalSales: 5340, totalCash: 3210, totalCard: 2130, numberOfSales: 41, profit: 1869 },
  { date: "2026-02-21", totalSales: 3980, totalCash: 2480, totalCard: 1500, numberOfSales: 28, profit: 1393 },
  { date: "2026-02-20", totalSales: 6120, totalCash: 3750, totalCard: 2370, numberOfSales: 47, profit: 2142 },
  { date: "2026-02-19", totalSales: 4560, totalCash: 2800, totalCard: 1760, numberOfSales: 35, profit: 1596 },
]

export function getTotalSales() {
  return recentSales.reduce((sum, sale) => sum + sale.total, 0)
}

export function getTotalCash() {
  return recentSales.filter((s) => s.paymentMethod === "cash").reduce((sum, sale) => sum + sale.total, 0)
}

export function getTotalCard() {
  return recentSales.filter((s) => s.paymentMethod === "card").reduce((sum, sale) => sum + sale.total, 0)
}

export function getNumberOfSales() {
  return recentSales.length
}

export function getTotalProfit() {
  return Math.round(getTotalSales() * 0.35)
}
