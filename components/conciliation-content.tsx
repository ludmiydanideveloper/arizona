"use client"

import { useState, useEffect } from "react"
import { Check, PackagePlus, Trash2, FileSearch, AlertTriangle, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ConciliationItem } from "@/lib/data"
import { cn } from "@/lib/utils"

type FilterStatus = "all" | "pending" | "resolved" | "added_to_inventory"

export function ConciliationContent() {
  const [items, setItems] = useState<ConciliationItem[]>([])
  const [filter, setFilter] = useState<FilterStatus>("all")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ConciliationItem | null>(null)
  const [inventoryForm, setInventoryForm] = useState({
    cashPrice: "",
    cardPrice: "",
    stock: "",
    category: "",
  })

  useEffect(() => {
    const stored = localStorage.getItem("conciliation_items")
    if (stored) {
      try {
        setItems(JSON.parse(stored))
      } catch {
        setItems([])
      }
    }
  }, [])

  function saveItems(updated: ConciliationItem[]) {
    setItems(updated)
    localStorage.setItem("conciliation_items", JSON.stringify(updated))
  }

  function markResolved(id: string) {
    const updated = items.map((item) =>
      item.id === id ? { ...item, status: "resolved" as const } : item
    )
    saveItems(updated)
  }

  function openAddToInventory(item: ConciliationItem) {
    setSelectedItem(item)
    setInventoryForm({
      cashPrice: item.unitPrice.toString(),
      cardPrice: (item.unitPrice * 1.05).toFixed(2),
      stock: item.quantity.toString(),
      category: "",
    })
    setAddDialogOpen(true)
  }

  function confirmAddToInventory() {
    if (!selectedItem) return
    const updated = items.map((item) =>
      item.id === selectedItem.id
        ? { ...item, status: "added_to_inventory" as const }
        : item
    )
    saveItems(updated)
    setAddDialogOpen(false)
    setSelectedItem(null)
  }

  function deleteItem(id: string) {
    const updated = items.filter((item) => item.id !== id)
    saveItems(updated)
  }

  const filtered = filter === "all" ? items : items.filter((item) => item.status === filter)

  const pendingCount = items.filter((i) => i.status === "pending").length
  const resolvedCount = items.filter((i) => i.status === "resolved").length
  const addedCount = items.filter((i) => i.status === "added_to_inventory").length

  function getStatusBadge(status: ConciliationItem["status"]) {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-chart-3/30 text-chart-3 bg-chart-3/10">
            Pending
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
            Resolved
          </Badge>
        )
      case "added_to_inventory":
        return (
          <Badge variant="outline" className="border-accent/30 text-accent bg-accent/10">
            Added to Inventory
          </Badge>
        )
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <AlertTriangle className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{resolvedCount}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <PackagePlus className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{addedCount}</p>
                <p className="text-xs text-muted-foreground">Added to Inventory</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" />
              <CardTitle className="text-card-foreground">Conciliation</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {(["all", "pending", "resolved", "added_to_inventory"] as FilterStatus[]).map(
                (f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className="capitalize text-xs"
                  >
                    {f === "added_to_inventory" ? "In Inventory" : f}
                  </Button>
                )
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileSearch className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium text-card-foreground">
                {items.length === 0
                  ? "No conciliation items yet"
                  : "No items match this filter"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {items.length === 0
                  ? "When you sell unregistered products, they will appear here for review."
                  : "Try changing the filter to see other items."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden sm:table-cell">Barcode</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="hidden md:table-cell">Sale ID</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-card-foreground">
                        {item.name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs font-mono">
                        {item.barcode || "-"}
                      </TableCell>
                      <TableCell className="text-center text-card-foreground">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-card-foreground">
                        ${item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-card-foreground">
                        ${item.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs font-mono">
                        {item.saleId}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                        {item.date}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === "pending" && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10"
                              onClick={() => openAddToInventory(item)}
                              title="Add to inventory"
                            >
                              <PackagePlus className="h-4 w-4" />
                              <span className="sr-only">Add to inventory</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => markResolved(item.id)}
                              title="Mark resolved"
                            >
                              <Check className="h-4 w-4" />
                              <span className="sr-only">Mark resolved</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteItem(item.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        )}
                        {item.status !== "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteItem(item.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add to Inventory Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Add to Inventory</DialogTitle>
            <DialogDescription>
              Add &ldquo;{selectedItem?.name}&rdquo; to the product inventory with the following details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="inv-cash">Cash Price</Label>
                <Input
                  id="inv-cash"
                  type="number"
                  step="0.01"
                  value={inventoryForm.cashPrice}
                  onChange={(e) =>
                    setInventoryForm({ ...inventoryForm, cashPrice: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inv-card">Card Price</Label>
                <Input
                  id="inv-card"
                  type="number"
                  step="0.01"
                  value={inventoryForm.cardPrice}
                  onChange={(e) =>
                    setInventoryForm({ ...inventoryForm, cardPrice: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="inv-stock">Initial Stock</Label>
                <Input
                  id="inv-stock"
                  type="number"
                  value={inventoryForm.stock}
                  onChange={(e) =>
                    setInventoryForm({ ...inventoryForm, stock: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inv-category">Category</Label>
                <Input
                  id="inv-category"
                  placeholder="e.g. Snacks"
                  value={inventoryForm.category}
                  onChange={(e) =>
                    setInventoryForm({ ...inventoryForm, category: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAddToInventory}>
              Add to Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
