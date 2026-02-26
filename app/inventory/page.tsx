import { AppShell } from "@/components/app-shell"
import { InventoryContent } from "@/components/inventory-content"

export default function InventoryPage() {
  return (
    <AppShell title="Inventory">
      <InventoryContent />
    </AppShell>
  )
}
