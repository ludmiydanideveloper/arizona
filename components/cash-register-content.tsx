"use client"

import { useState } from "react"
import {
  Banknote,
  CreditCard,
  DollarSign,
  Clock,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SummaryCard } from "@/components/summary-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  getTotalSales,
  getTotalCash,
  getTotalCard,
  recentSales,
} from "@/lib/data"

export function CashRegisterContent() {
  const [closed, setClosed] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      {/* Status */}
      <Card className={closed ? "border-destructive/30 bg-destructive/5" : "border-accent/30 bg-accent/5"}>
        <CardContent className="flex items-center gap-3 p-4">
          <Clock className={closed ? "h-5 w-5 text-destructive" : "h-5 w-5 text-accent"} />
          <div>
            <p className={closed ? "text-sm font-medium text-destructive" : "text-sm font-medium text-accent"}>
              {closed ? "Cash register is closed" : "Cash register is open"}
            </p>
            <p className="text-xs text-muted-foreground">
              {closed ? "Closed at " + new Date().toLocaleTimeString() : "Today, " + new Date().toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Cash"
          value={`$${getTotalCash().toFixed(2)}`}
          icon={Banknote}
        />
        <SummaryCard
          title="Total Card"
          value={`$${getTotalCard().toFixed(2)}`}
          icon={CreditCard}
        />
        <SummaryCard
          title="Total General"
          value={`$${getTotalSales().toFixed(2)}`}
          icon={DollarSign}
        />
      </div>

      {/* Transaction log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground">
              {"Today's Transactions"}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {recentSales.length} transactions
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="hidden sm:table-cell">Items</TableHead>
                  <TableHead className="text-center">Method</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {sale.id}
                    </TableCell>
                    <TableCell className="text-card-foreground text-sm">
                      {sale.date.split(" ")[1]}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                      {sale.items.map((i) => i.name).join(", ")}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground capitalize">
                        {sale.paymentMethod === "cash" ? (
                          <Banknote className="h-3 w-3" />
                        ) : (
                          <CreditCard className="h-3 w-3" />
                        )}
                        {sale.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-card-foreground">
                      ${sale.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Close Cash */}
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="gap-2"
              disabled={closed}
            >
              <XCircle className="h-4 w-4" />
              Close Cash Register
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close Cash Register?</AlertDialogTitle>
              <AlertDialogDescription>
                This will close the cash register for today. Make sure all
                transactions have been recorded. Total for today:{" "}
                <strong>${getTotalSales().toFixed(2)}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => setClosed(true)}>
                Confirm Close
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
