import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["BANK", "EWALLET"]).optional(),
  role: z.enum(["TRANSIT", "BILLS", "SAVINGS", "TRANSPORT", "GROCERY", "SOCIAL"]).optional(),
  balance: z.number().min(0).optional(),
  color: z.string().nullable().optional(),
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
    const parsed = updateAccountSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const existing = await prisma.account.findFirst({ where: { id, familyId: session.id } })
    if (!existing) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 })

    const updated = await prisma.account.update({
      where: { id },
      data: parsed.data,
      select: { id: true, name: true, type: true, role: true, balance: true, color: true },
    })

    return NextResponse.json({ data: { ...updated, balance: Number(updated.balance) } })
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

    const existing = await prisma.account.findFirst({ where: { id, familyId: session.id } })
    if (!existing) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 })

    await prisma.account.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
