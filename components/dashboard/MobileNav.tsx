"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface MobileNavProps {
  items: NavItem[]
  familyName: string
}

// Show only the most important 5 items in bottom nav
const MOBILE_ITEMS_LIMIT = 5

export function MobileNav({ items, familyName: _ }: MobileNavProps) {
  const pathname = usePathname()
  const mobileItems = items.slice(0, MOBILE_ITEMS_LIMIT)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t bg-background">
      <ul className="flex">
        {mobileItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
