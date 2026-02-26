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
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Sales", href: "/sales", icon: ShoppingCart },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Conciliation", href: "/conciliation", icon: FileSearch },
  { label: "Cash Register", href: "/cash-register", icon: Wallet },
  { label: "Statistics", href: "/statistics", icon: BarChart3 },
]

export function MobileSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-foreground"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  A
                </div>
                <span className="text-lg font-bold tracking-tight">ARIZONA</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close menu</span>
              </Button>
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
                    onClick={() => setOpen(false)}
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
          </div>
        </>
      )}
    </div>
  )
}
