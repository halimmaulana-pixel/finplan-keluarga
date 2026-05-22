import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const updateDebtSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["PINJOL", "KPR", "KKB", "PERSONAL", "OTHER"]).optional(),
  totalAmount: z.number().positive().optional(),
  remainingAmount: z.number().min(0).optional(),
  monthlyPayment: z.number().positive().optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  remainingMonths: z.number().int().min(0).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const parsed = updateDebtSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const existing = await prisma.debt.findFirst({ where: { id, familyId: session.id } })
    if (!existing) return NextResponse.json({ error: "Hutang tidak ditemukan" }, { status: 404 })

    const updated = await prisma.debt.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({
      data: {
        ...updated,
        totalAmount: Number(updated.totalAmount),
        remainingAmount: Number(updated.remainingAmount),
        monthlyPayment: Number(updated.monthlyPayment),
      },
    })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const existing = await prisma.debt.findFirst({ where: { id, familyId: session.id } })
    if (!existing) return NextResponse.json({ error: "Hutang tidak ditemukan" }, { status: 404 })

    await prisma.debt.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
