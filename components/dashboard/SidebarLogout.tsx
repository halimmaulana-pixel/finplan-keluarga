"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SidebarLogout() {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" })
    toast.success("Berhasil keluar")
    router.push("/masuk")
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" />
      Keluar
    </Button>
  )
}
