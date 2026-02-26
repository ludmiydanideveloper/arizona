"use client"

import { useState, useCallback } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Upload,
  Download,
  Check,
  AlertCircle,
  Grid3X3,
  List,
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
import { products as initialProducts, type Product } from "@/lib/data"
import { cn } from "@/lib/utils"

type Tab = "list" | "bulk"

interface BulkRow {
  id: string
  name: string
  barcode: string
  category: string
  stock: string
  cashPrice: string
  cardPrice: string
}

function emptyRow(): BulkRow {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    name: "",
    barcode: "",
    category: "",
    stock: "",
    cashPrice: "",
    cardPrice: "",
  }
}

function createEmptyRows(count: number): BulkRow[] {
  return Array.from({ length: count }, () => emptyRow())
}

export function InventoryContent() {
  const [items, setItems] = useState<Product[]>(initialProducts)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Product | null>(null)
  const [form, setForm] = useState({
    name: "",
    barcode: "",
    stock: "",
    cashPrice: "",
    cardPrice: "",
    category: "",
  })
  const [activeTab, setActiveTab] = useState<Tab>("list")

  // Bulk upload state
  const [bulkRows, setBulkRows] = useState<BulkRow[]>(createEmptyRows(10))
  const [bulkMessage, setBulkMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const filtered = items.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  })

  function openAdd() {
    setEditItem(null)
    setForm({ name: "", barcode: "", stock: "", cashPrice: "", cardPrice: "", category: "" })
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setEditItem(product)
    setForm({
      name: product.name,
      barcode: product.barcode,
      stock: product.stock.toString(),
      cashPrice: product.cashPrice.toString(),
      cardPrice: product.cardPrice.toString(),
      category: product.category,
    })
    setDialogOpen(true)
  }

  function handleSave() {
    const newProduct: Product = {
      id: editItem ? editItem.id : Date.now().toString(),
      name: form.name,
      barcode: form.barcode,
      stock: parseInt(form.stock) || 0,
      cashPrice: parseFloat(form.cashPrice) || 0,
      cardPrice: parseFloat(form.cardPrice) || 0,
      category: form.category,
    }

    if (editItem) {
      setItems((prev) => prev.map((p) => (p.id === editItem.id ? newProduct : p)))
    } else {
      setItems((prev) => [...prev, newProduct])
    }
    setDialogOpen(false)
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }

  // Bulk upload handlers
  const updateBulkCell = useCallback(
    (rowId: string, field: keyof BulkRow, value: string) => {
      setBulkRows((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
      )
    },
    []
  )

  function addBulkRows() {
    setBulkRows((prev) => [...prev, ...createEmptyRows(5)])
  }

  function removeBulkRow(rowId: string) {
    setBulkRows((prev) => prev.filter((r) => r.id !== rowId))
  }

  function clearBulkRows() {
    setBulkRows(createEmptyRows(10))
    setBulkMessage(null)
  }

  function submitBulk() {
    const validRows = bulkRows.filter((row) => row.name.trim() !== "")
    if (validRows.length === 0) {
      setBulkMessage({ type: "error", text: "No valid rows to import. At least the product name is required." })
      return
    }

    const newProducts: Product[] = validRows.map((row) => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: row.name.trim(),
      barcode: row.barcode.trim(),
      category: row.category.trim() || "General",
      stock: parseInt(row.stock) || 0,
      cashPrice: parseFloat(row.cashPrice) || 0,
      cardPrice: parseFloat(row.cardPrice) || 0,
    }))

    setItems((prev) => [...prev, ...newProducts])
    setBulkRows(createEmptyRows(10))
    setBulkMessage({
      type: "success",
      text: `${newProducts.length} product${newProducts.length > 1 ? "s" : ""} imported successfully.`,
    })
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>, rowIndex: number, fieldIndex: number) {
    const pasteData = e.clipboardData.getData("text")
    if (!pasteData.includes("\t") && !pasteData.includes("\n")) return

    e.preventDefault()
    const fields: (keyof BulkRow)[] = ["name", "barcode", "category", "stock", "cashPrice", "cardPrice"]
    const lines = pasteData.split(/\r?\n/).filter((line) => line.trim() !== "")

    setBulkRows((prev) => {
      const updated = [...prev]
      // Ensure enough rows
      while (updated.length < rowIndex + lines.length) {
        updated.push(emptyRow())
      }
      lines.forEach((line, lineIdx) => {
        const cells = line.split("\t")
        cells.forEach((cell, cellIdx) => {
          const targetField = fields[fieldIndex + cellIdx]
          if (targetField && updated[rowIndex + lineIdx]) {
            updated[rowIndex + lineIdx] = {
              ...updated[rowIndex + lineIdx],
              [targetField]: cell.trim(),
            }
          }
        })
      })
      return updated
    })
  }

  const filledRowCount = bulkRows.filter((r) => r.name.trim() !== "").length

  return (
    <>
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={activeTab === "list" ? "default" : "outline"}
          onClick={() => setActiveTab("list")}
          className="gap-2"
        >
          <List className="h-4 w-4" />
          Product List
        </Button>
        <Button
          variant={activeTab === "bulk" ? "default" : "outline"}
          onClick={() => setActiveTab("bulk")}
          className="gap-2"
        >
          <Grid3X3 className="h-4 w-4" />
          Bulk Upload
        </Button>
      </div>

      {activeTab === "list" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-card-foreground">Inventory</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                  {search && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setSearch("")}
                    >
                      <X className="h-3.5 w-3.5" />
                      <span className="sr-only">Clear search</span>
                    </Button>
                  )}
                </div>
                <Button onClick={openAdd} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Product</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden md:table-cell">Barcode</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Cash Price</TableHead>
                    <TableHead className="text-right">Card Price</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-card-foreground">
                        {product.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs font-mono">
                        {product.barcode}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {product.category}
                        </span>
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
                      <TableCell className="text-right text-card-foreground">
                        ${product.cashPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-card-foreground">
                        ${product.cardPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => openEdit(product)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        No products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "bulk" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-card-foreground">Bulk Product Upload</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter products like a spreadsheet. You can paste data directly from Excel or Google Sheets.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {filledRowCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {filledRowCount} row{filledRowCount > 1 ? "s" : ""} filled
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={addBulkRows} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Rows
                </Button>
                <Button variant="outline" size="sm" onClick={clearBulkRows} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={submitBulk}
                  disabled={filledRowCount === 0}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import {filledRowCount > 0 ? `(${filledRowCount})` : ""}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {bulkMessage && (
              <div
                className={cn(
                  "mx-4 mb-3 flex items-center gap-2 rounded-lg p-3 text-sm",
                  bulkMessage.type === "success"
                    ? "bg-accent/10 text-accent"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {bulkMessage.type === "success" ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {bulkMessage.text}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-2 py-2.5 text-left text-xs font-medium text-muted-foreground w-8">
                      #
                    </th>
                    <th className="px-1 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Product Name *
                    </th>
                    <th className="px-1 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Barcode
                    </th>
                    <th className="px-1 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="px-1 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Stock
                    </th>
                    <th className="px-1 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Cash Price
                    </th>
                    <th className="px-1 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Card Price
                    </th>
                    <th className="px-1 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.map((row, rowIndex) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-border/50 transition-colors",
                        row.name.trim() !== "" && "bg-primary/3"
                      )}
                    >
                      <td className="px-2 py-1 text-xs text-muted-foreground font-mono">
                        {rowIndex + 1}
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateBulkCell(row.id, "name", e.target.value)}
                          onPaste={(e) => handlePaste(e, rowIndex, 0)}
                          placeholder="Product name"
                          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-card-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-card focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          value={row.barcode}
                          onChange={(e) => updateBulkCell(row.id, "barcode", e.target.value)}
                          onPaste={(e) => handlePaste(e, rowIndex, 1)}
                          placeholder="Barcode"
                          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm font-mono text-card-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-card focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          value={row.category}
                          onChange={(e) => updateBulkCell(row.id, "category", e.target.value)}
                          onPaste={(e) => handlePaste(e, rowIndex, 2)}
                          placeholder="Category"
                          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-card-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-card focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          value={row.stock}
                          onChange={(e) => updateBulkCell(row.id, "stock", e.target.value)}
                          onPaste={(e) => handlePaste(e, rowIndex, 3)}
                          placeholder="0"
                          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-card-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-card focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          step="0.01"
                          value={row.cashPrice}
                          onChange={(e) => updateBulkCell(row.id, "cashPrice", e.target.value)}
                          onPaste={(e) => handlePaste(e, rowIndex, 4)}
                          placeholder="0.00"
                          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-card-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-card focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          step="0.01"
                          value={row.cardPrice}
                          onChange={(e) => updateBulkCell(row.id, "cardPrice", e.target.value)}
                          onPaste={(e) => handlePaste(e, rowIndex, 5)}
                          placeholder="0.00"
                          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-card-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-card focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeBulkRow(row.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only">Remove row</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Tip: Copy rows from Excel or Google Sheets and paste them directly. The data will auto-fill across columns.
                Only rows with a product name will be imported.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editItem ? "Edit Product" : "Add Product"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editItem ? "Edit the selected product details" : "Add a new product to inventory"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cashPrice">Cash Price</Label>
                <Input
                  id="cashPrice"
                  type="number"
                  step="0.01"
                  value={form.cashPrice}
                  onChange={(e) => setForm({ ...form, cashPrice: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cardPrice">Card Price</Label>
                <Input
                  id="cardPrice"
                  type="number"
                  step="0.01"
                  value={form.cardPrice}
                  onChange={(e) => setForm({ ...form, cardPrice: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.name}>
              {editItem ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
