import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  CreditCard,
  PiggyBank,
  Building2,
  ShoppingCart,
  Landmark,
  Lightbulb,
  BarChart3,
  LogOut,
} from "lucide-react"
import { MobileNav } from "@/components/dashboard/MobileNav"
import { SidebarLogout } from "@/components/dashboard/SidebarLogout"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dompet", label: "Dompet", icon: Wallet },
  { href: "/tagihan", label: "Tagihan", icon: Receipt },
  { href: "/hutang", label: "Hutang", icon: CreditCard },
  { href: "/tabungan", label: "Tabungan", icon: PiggyBank },
  { href: "/aset", label: "Aset", icon: Building2 },
  { href: "/pengeluaran", label: "Pengeluaran", icon: ShoppingCart },
  { href: "/rekening", label: "Rekening", icon: Landmark },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
]

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) {
    redirect("/masuk")
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — hidden on mobile */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 border-r bg-sidebar text-sidebar-foreground">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-5 border-b border-sidebar-border">
          <span className="text-2xl">💰</span>
          <span className="text-xl font-bold tracking-tight">FinPlan</span>
        </div>

        {/* Family name */}
        <div className="px-5 py-3 border-b border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wider">Keluarga</p>
          <p className="text-sm font-medium truncate">{session.name}</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <SidebarLogout />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:pl-60">
        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav items={NAV_ITEMS} familyName={session.name} />
    </div>
  )
}
