"use client"

import { LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { supabase } from "@/utils/supabase"

export function TopBar({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <h1 className="text-lg font-semibold text-card-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Admin</span>
        </div>
        <Button
  variant="ghost"
  size="sm"
  className="text-muted-foreground hover:text-foreground"
  onClick={async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }}
>
  <LogOut className="h-4 w-4" />
  <span className="hidden sm:inline ml-1">Logout</span>
</Button>
      </div>
    </header>
  )
}
