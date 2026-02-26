import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

export function SummaryCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string
  value: string
  icon: LucideIcon
  trend?: string
}) {
  return (
    <Card className="bg-card">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
          {trend && (
            <p className="text-xs text-accent">{trend}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
