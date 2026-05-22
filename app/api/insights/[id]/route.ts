import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const existing = await prisma.insight.findFirst({ where: { id, familyId: session.id } })
    if (!existing) return NextResponse.json({ error: "Insight tidak ditemukan" }, { status: 404 })

    const updated = await prisma.insight.update({
      where: { id },
      data: { isRead: true },
      select: { id: true, isRead: true },
    })

    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
