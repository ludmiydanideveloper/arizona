"use client"

import { DollarSign, TrendingUp, CalendarCheck, Banknote, CreditCard } from "lucide-react"
import { SummaryCard } from "@/components/summary-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getTotalSales,
  getTotalProfit,
  topSellingProducts,
  dailySalesData,
  closedDaysHistory,
} from "@/lib/data"

const BAR_COLORS = ["#4a7dfc", "#28b485", "#e67e22", "#9b59b6", "#f1c40f"]

export function StatisticsContent() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          title="Total Sales"
          value={`$${getTotalSales().toLocaleString()}`}
          icon={DollarSign}
        />
        <SummaryCard
          title="Total Profit"
          value={`$${getTotalProfit().toLocaleString()}`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top selling products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-card-foreground">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSellingProducts}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(220 15% 90%)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(220 10% 50%)"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid hsl(220 15% 90%)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                    formatter={(value: number) => [`${value} units`, "Sales"]}
                  />
                  <Bar dataKey="sales" radius={[0, 6, 6, 0]}>
                    {topSellingProducts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly sales trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-card-foreground">Weekly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid hsl(220 15% 90%)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                    formatter={(value: number) => [`$${value}`, "Sales"]}
                  />
                  <Bar dataKey="sales" fill="#28b485" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">Product Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {topSellingProducts.map((product, i) => (
              <div key={product.name} className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground">{product.name}</p>
                  <div className="mt-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${(product.sales / topSellingProducts[0].sales) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-card-foreground tabular-nums">
                  {product.sales} units
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Closed Days History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-card-foreground">Closed Days History</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Summary of the last {closedDaysHistory.length} days with closed registers
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Total
                    </span>
                  </TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <Banknote className="h-3 w-3" /> Cash
                    </span>
                  </TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <CreditCard className="h-3 w-3" /> Card
                    </span>
                  </TableHead>
                  <TableHead className="text-center">Sales</TableHead>
                  <TableHead className="text-right">
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Profit
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closedDaysHistory.map((day) => {
                  const dateObj = new Date(day.date + "T12:00:00")
                  const formatted = dateObj.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                  return (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium text-card-foreground">
                        {formatted}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-card-foreground">
                        ${day.totalSales.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                        ${day.totalCash.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                        ${day.totalCard.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {day.numberOfSales}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-accent">
                        ${day.profit.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {/* Totals row */}
                <TableRow className="bg-secondary/50 font-semibold">
                  <TableCell className="text-card-foreground">Total (5 days)</TableCell>
                  <TableCell className="text-right text-card-foreground">
                    ${closedDaysHistory.reduce((s, d) => s + d.totalSales, 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                    ${closedDaysHistory.reduce((s, d) => s + d.totalCash, 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                    ${closedDaysHistory.reduce((s, d) => s + d.totalCard, 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {closedDaysHistory.reduce((s, d) => s + d.numberOfSales, 0)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-accent">
                    ${closedDaysHistory.reduce((s, d) => s + d.profit, 0).toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
