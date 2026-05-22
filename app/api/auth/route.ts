import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { hashPin, verifyPin, setSession, clearSession } from "@/lib/auth"

const loginSchema = z.object({
  familyCode: z.string().min(1),
  pin: z.string().min(4),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid" }, { status: 400 })
    }

    const { familyCode, pin } = parsed.data

    const family = await prisma.family.findFirst({
      where: { name: { equals: familyCode, mode: "insensitive" } },
      select: { id: true, name: true, pinHash: true },
    })

    if (!family) {
      return NextResponse.json({ error: "Keluarga tidak ditemukan" }, { status: 401 })
    }

    const valid = await verifyPin(pin, family.pinHash)
    if (!valid) {
      return NextResponse.json({ error: "PIN salah" }, { status: 401 })
    }

    await setSession(family.id)

    return NextResponse.json({ data: { familyId: family.id, name: family.name } })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function DELETE() {
  await clearSession()
  return NextResponse.json({ data: { success: true } })
}
