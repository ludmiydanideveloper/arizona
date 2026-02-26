"use client"

import { DollarSign, TrendingUp, ShoppingBag } from "lucide-react"
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
} from "recharts"
import {
  getTotalSales,
  getTotalProfit,
  getNumberOfSales,
  dailySalesData,
  recentSales,
} from "@/lib/data"

const CHART_BLUE = "#4a7dfc"

export function DashboardContent() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Total Sales"
          value={`$${getTotalSales().toLocaleString()}`}
          icon={DollarSign}
          trend="+12% from yesterday"
        />
        <SummaryCard
          title="Total Profit"
          value={`$${getTotalProfit().toLocaleString()}`}
          icon={TrendingUp}
          trend="+8% from yesterday"
        />
        <SummaryCard
          title="Number of Sales"
          value={getNumberOfSales().toString()}
          icon={ShoppingBag}
          trend="+5 from yesterday"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-card-foreground">Weekly Sales</CardTitle>
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
                  <Bar dataKey="sales" fill={CHART_BLUE} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {recentSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-card-foreground truncate">
                      {sale.items.map((i) => i.name).join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">{sale.date}</p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className="text-sm font-semibold text-card-foreground">
                      ${sale.total.toFixed(2)}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground capitalize">
                      {sale.paymentMethod}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
