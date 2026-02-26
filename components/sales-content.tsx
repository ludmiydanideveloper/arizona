"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ShoppingCart,
  AlertTriangle,
  PackagePlus,
  Printer,
  History,
  ChevronDown,
  ChevronUp,
  ScanBarcode,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { products, sellers, type CartItem, type Product, type ConciliationItem, type Sale } from "@/lib/data"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface UnregisteredItem {
  id: string
  name: string
  barcode: string
  unitPrice: number
  quantity: number
  isUnregistered: true
}

type CartEntry = CartItem | UnregisteredItem

function isUnregistered(item: CartEntry): item is UnregisteredItem {
  return "isUnregistered" in item && item.isUnregistered === true
}

export function SalesContent() {
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartEntry[]>([])
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [manualForm, setManualForm] = useState({
    name: "",
    barcode: "",
    unitPrice: "",
    quantity: "1",
  })
  const [conciliationItems, setConciliationItems] = useState<ConciliationItem[]>([])
  const [saleHistory, setSaleHistory] = useState<Sale[]>([])
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null)
  const [quickBarcode, setQuickBarcode] = useState("")
  const [addQuantities, setAddQuantities] = useState<Record<string, number>>({})
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Handle barcode scanner quick-add: when user scans or types a barcode and presses Enter
  const handleBarcodeSubmit = useCallback(
    (code: string) => {
      if (!code.trim()) return
      const q = code.trim().toLowerCase()
      const found = products.find(
        (p) => p.barcode.toLowerCase() === q || p.name.toLowerCase() === q
      )
      if (found) {
        const qty = addQuantities[found.id] || 1
        setCart((prev) => {
          const existing = prev.find((item) => item.id === found.id && !isUnregistered(item))
          if (existing) {
            return prev.map((item) =>
              item.id === found.id && !isUnregistered(item)
                ? { ...item, quantity: item.quantity + qty }
                : item
            )
          }
          return [...prev, { ...found, quantity: qty }]
        })
        setQuickBarcode("")
      } else {
        // Not found -> open manual dialog with barcode pre-filled
        setManualForm({ name: "", barcode: code.trim(), unitPrice: "", quantity: "1" })
        setManualDialogOpen(true)
        setQuickBarcode("")
      }
    },
    [addQuantities]
  )

  // Keyboard shortcut: F2 to focus barcode input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault()
        barcodeInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filteredProducts = useMemo(() => {
    if (!search) return products
    const q = search.toLowerCase()
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q)
    )
  }, [search])

  const noResults = search.length > 0 && filteredProducts.length === 0

  function addToCart(product: Product) {
    const qty = addQuantities[product.id] || 1
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id && !isUnregistered(item))
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && !isUnregistered(item)
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      }
      return [...prev, { ...product, quantity: qty }]
    })
    // Reset quantity picker for this product after adding
    setAddQuantities((prev) => {
      const copy = { ...prev }
      delete copy[product.id]
      return copy
    })
  }

  function setCartItemQuantity(id: string, newQty: number) {
    if (newQty <= 0) {
      removeFromCart(id)
      return
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQty } : item
      )
    )
  }

  function openManualDialog() {
    setManualForm({ name: "", barcode: search || "", unitPrice: "", quantity: "1" })
    setManualDialogOpen(true)
  }

  function addManualProduct() {
    const item: UnregisteredItem = {
      id: `unreg-${Date.now()}`,
      name: manualForm.name,
      barcode: manualForm.barcode,
      unitPrice: parseFloat(manualForm.unitPrice) || 0,
      quantity: parseInt(manualForm.quantity) || 1,
      isUnregistered: true,
    }
    setCart((prev) => [...prev, item])
    setManualDialogOpen(false)
  }

  function updateQuantity(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  function getItemPrice(item: CartEntry): number {
    if (isUnregistered(item)) return item.unitPrice
    return paymentMethod === "cash" ? item.cashPrice : item.cardPrice
  }

  const subtotal = cart.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0)

  const hasUnregistered = cart.some(isUnregistered)

  function completeSale() {
    if (cart.length === 0) return

    const saleId = `S${Date.now()}`
    const now = new Date().toISOString().slice(0, 16).replace("T", " ")

    // Build sale record (by sale, not by product)
    const saleRecord: Sale = {
      id: saleId,
      date: now,
      items: cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: getItemPrice(item),
      })),
      total: subtotal,
      paymentMethod,
    }

    setSaleHistory((prev) => [saleRecord, ...prev])
    setLastSale(saleRecord)

    const unregItems = cart.filter(isUnregistered)
    if (unregItems.length > 0) {
      const newConciliation: ConciliationItem[] = unregItems.map((item) => ({
        id: `C${Date.now()}-${item.id}`,
        name: item.name,
        barcode: item.barcode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * item.quantity,
        saleId,
        date: now,
        status: "pending" as const,
      }))
      setConciliationItems((prev) => [...prev, ...newConciliation])

      const existing = JSON.parse(localStorage.getItem("conciliation_items") || "[]")
      localStorage.setItem("conciliation_items", JSON.stringify([...existing, ...newConciliation]))
    }

    setCart([])
  }

  function printSale(sale: Sale) {
    const printWindow = window.open("", "_blank", "width=360,height=600")
    if (!printWindow) return

    const itemsHtml = sale.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:4px 0;font-size:13px">${item.name}</td>
            <td style="text-align:center;font-size:13px">${item.quantity}</td>
            <td style="text-align:right;font-size:13px">$${(item.price * item.quantity).toFixed(2)}</td>
          </tr>`
      )
      .join("")

    printWindow.document.write(`
      <html>
        <head><title>Receipt - ${sale.id}</title></head>
        <body style="font-family:monospace;padding:20px;max-width:320px;margin:0 auto">
          <div style="text-align:center;margin-bottom:16px">
            <h2 style="margin:0;font-size:18px">ARIZONA</h2>
            <p style="margin:4px 0;font-size:12px;color:#666">Point of Sale</p>
            <hr/>
          </div>
          <p style="font-size:12px;color:#666;margin:8px 0">Sale: ${sale.id}</p>
          <p style="font-size:12px;color:#666;margin:4px 0">Date: ${sale.date}</p>
          <p style="font-size:12px;color:#666;margin:4px 0">Payment: ${sale.paymentMethod.toUpperCase()}</p>
          <hr/>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="border-bottom:1px solid #ccc">
                <th style="text-align:left;padding:4px 0;font-size:12px">Item</th>
                <th style="text-align:center;font-size:12px">Qty</th>
                <th style="text-align:right;font-size:12px">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <hr/>
          <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:16px;margin-top:8px">
            <span>TOTAL</span>
            <span>$${sale.total.toFixed(2)}</span>
          </div>
          <hr/>
          <p style="text-align:center;font-size:11px;color:#999;margin-top:16px">Thank you for your purchase!</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
      {/* Products */}
      <div className="flex-1 min-w-0">
        {/* Quick barcode scanner bar */}
        <Card className="mb-4">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <ScanBarcode className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-card-foreground hidden sm:inline">Quick Scan</span>
              </div>
              <div className="relative flex-1">
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan barcode or type name and press Enter (F2 to focus)"
                  value={quickBarcode}
                  onChange={(e) => setQuickBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleBarcodeSubmit(quickBarcode)
                    }
                  }}
                  className="pr-20"
                />
                <Button
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
                  onClick={() => handleBarcodeSubmit(quickBarcode)}
                  disabled={!quickBarcode.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 ml-7 sm:ml-[108px]">
              Scans auto-add to cart. If not found, opens manual entry.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-card-foreground">Products</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={openManualDialog}
                className="gap-2 text-chart-3 border-chart-3/30 hover:bg-chart-3/10 hover:text-chart-3"
              >
                <PackagePlus className="h-4 w-4" />
                <span className="hidden sm:inline">Unregistered Product</span>
              </Button>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Filter products by name or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden sm:table-cell">Barcode</TableHead>
                    <TableHead className="text-right">Cash</TableHead>
                    <TableHead className="text-right">Card</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center w-[100px]">Qty</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-card-foreground">
                        {product.name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs font-mono">
                        {product.barcode}
                      </TableCell>
                      <TableCell className="text-right text-card-foreground">
                        ${product.cashPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-card-foreground">
                        ${product.cardPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            product.stock > 20
                              ? "bg-accent/15 text-accent"
                              : product.stock > 10
                              ? "bg-chart-3/15 text-chart-3"
                              : "bg-destructive/15 text-destructive"
                          )}
                        >
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              setAddQuantities((prev) => ({
                                ...prev,
                                [product.id]: Math.max(1, (prev[product.id] || 1) - 1),
                              }))
                            }
                          >
                            <Minus className="h-3 w-3" />
                            <span className="sr-only">Decrease</span>
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={addQuantities[product.id] || 1}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1
                              setAddQuantities((prev) => ({
                                ...prev,
                                [product.id]: Math.max(1, val),
                              }))
                            }}
                            className="h-6 w-10 text-center text-xs px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              setAddQuantities((prev) => ({
                                ...prev,
                                [product.id]: (prev[product.id] || 1) + 1,
                              }))
                            }
                          >
                            <Plus className="h-3 w-3" />
                            <span className="sr-only">Increase</span>
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => addToCart(product)}
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Plus className="h-4 w-4" />
                          <span className="sr-only">Add {product.name}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {noResults && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <Search className="h-8 w-8 text-muted-foreground/40" />
                          <div>
                            <p className="text-sm font-medium text-card-foreground">
                              Product not found in inventory
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              You can add it as an unregistered product. It will be sent to conciliation.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openManualDialog}
                            className="gap-2 mt-1 text-chart-3 border-chart-3/30 hover:bg-chart-3/10 hover:text-chart-3"
                          >
                            <PackagePlus className="h-4 w-4" />
                            Add Unregistered Product
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart */}
      <div className="w-full lg:w-[380px]">
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <CardTitle className="text-card-foreground">Cart</CardTitle>
              {cart.length > 0 && (
                <span className="ml-auto text-sm text-muted-foreground">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">Cart is empty</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cart.map((item) => {
                  const price = getItemPrice(item)
                  const unreg = isUnregistered(item)
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-3",
                        unreg
                          ? "bg-chart-3/8 border border-chart-3/20"
                          : "bg-secondary/50"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {unreg && (
                            <AlertTriangle className="h-3.5 w-3.5 text-chart-3 shrink-0" />
                          )}
                          <p className="text-sm font-medium text-card-foreground truncate">
                            {item.name}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${price.toFixed(2)} each
                          {unreg && " - Unregistered"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                          <span className="sr-only">Decrease</span>
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value)
                            if (!isNaN(val)) setCartItemQuantity(item.id, val)
                          }}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value)
                            if (isNaN(val) || val <= 0) setCartItemQuantity(item.id, 1)
                          }}
                          className="h-7 w-12 text-center text-sm font-medium px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                          <span className="sr-only">Increase</span>
                        </Button>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <p className="text-sm font-semibold text-card-foreground">
                          ${(price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Unregistered warning */}
            {hasUnregistered && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-chart-3/10 p-3">
                <AlertTriangle className="h-4 w-4 text-chart-3 mt-0.5 shrink-0" />
                <p className="text-xs text-chart-3">
                  This sale includes unregistered products. They will be sent to the Conciliation page after completing the sale.
                </p>
              </div>
            )}

            {/* Payment method */}
            <div className="mt-5">
              <p className="text-sm font-medium text-card-foreground mb-2">
                Payment Method
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("cash")}
                  className="gap-2"
                >
                  <Banknote className="h-4 w-4" />
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("card")}
                  className="gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </Button>
              </div>
            </div>

            {/* Subtotal + Complete */}
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-xl font-bold text-card-foreground">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <Button
              className="mt-4 w-full"
              size="lg"
              disabled={cart.length === 0}
              onClick={completeSale}
            >
              Complete Sale
            </Button>
            {lastSale && (
              <Button
                variant="outline"
                className="mt-2 w-full gap-2"
                onClick={() => printSale(lastSale)}
              >
                <Printer className="h-4 w-4" />
                Print Last Receipt
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Sale History */}
        {saleHistory.length > 0 && (
          <Card className="mt-4">
            <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm text-card-foreground">
                        Sale History ({saleHistory.length})
                      </CardTitle>
                    </div>
                    {historyOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-2">
                    {saleHistory.map((sale) => (
                      <div key={sale.id} className="rounded-lg border border-border">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSaleId(expandedSaleId === sale.id ? null : sale.id)
                          }
                          className="flex w-full items-center justify-between p-3 text-left hover:bg-secondary/30 transition-colors rounded-lg"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-mono text-muted-foreground">{sale.id}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {sale.date} - {sale.items.length} item(s) - {sale.paymentMethod.toUpperCase()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className="text-sm font-semibold text-card-foreground">
                              ${sale.total.toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                printSale(sale)
                              }}
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span className="sr-only">Print receipt</span>
                            </Button>
                          </div>
                        </button>
                        {expandedSaleId === sale.id && (
                          <div className="border-t border-border px-3 py-2 bg-secondary/20">
                            {sale.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between py-1 text-xs"
                              >
                                <span className="text-card-foreground">
                                  {item.name} x{item.quantity}
                                </span>
                                <span className="text-muted-foreground">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}
      </div>

      {/* Manual product dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Unregistered Product</DialogTitle>
            <DialogDescription>
              This product is not in the inventory. Enter the details manually. It will be sent to Conciliation after the sale.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="manual-name">Product Name</Label>
              <Input
                id="manual-name"
                placeholder="e.g. Unknown chips bag"
                value={manualForm.name}
                onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="manual-barcode">Barcode (optional)</Label>
                <Input
                  id="manual-barcode"
                  placeholder="Scan or type"
                  value={manualForm.barcode}
                  onChange={(e) => setManualForm({ ...manualForm, barcode: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manual-quantity">Quantity</Label>
                <Input
                  id="manual-quantity"
                  type="number"
                  min="1"
                  value={manualForm.quantity}
                  onChange={(e) => setManualForm({ ...manualForm, quantity: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manual-price">Unit Price ($)</Label>
              <Input
                id="manual-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={manualForm.unitPrice}
                onChange={(e) => setManualForm({ ...manualForm, unitPrice: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addManualProduct} disabled={!manualForm.name || !manualForm.unitPrice}>
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
