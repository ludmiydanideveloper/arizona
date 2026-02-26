"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wallet,
  BarChart3,
  FileSearch,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Sales", href: "/sales", icon: ShoppingCart },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Conciliation", href: "/conciliation", icon: FileSearch },
  { label: "Cash Register", href: "/cash-register", icon: Wallet },
  { label: "Statistics", href: "/statistics", icon: BarChart3 },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          A
        </div>
        <span className="text-lg font-bold tracking-tight">ARIZONA</span>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 pb-4">
        <div className="rounded-lg bg-sidebar-accent/50 px-3 py-3">
          <p className="text-xs text-sidebar-foreground/50">ARIZONA POS v1.0</p>
        </div>
      </div>
    </aside>
  )
}
