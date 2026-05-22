import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7)

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Format bulan tidak valid (gunakan YYYY-MM)" }, { status: 400 })
    }

    const insights = await prisma.insight.findMany({
      where: { familyId: session.id, month },
      orderBy: { createdAt: "desc" },
    })

    const sorted = insights.sort((a, b) => {
      const sa = SEVERITY_ORDER[a.severity] ?? 99
      const sb = SEVERITY_ORDER[b.severity] ?? 99
      return sa - sb
    })

    return NextResponse.json({ data: sorted })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
