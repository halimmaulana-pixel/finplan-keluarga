import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["BANK", "EWALLET"]),
  role: z.enum(["TRANSIT", "BILLS", "SAVINGS", "TRANSPORT", "GROCERY", "SOCIAL"]),
  balance: z.number().min(0).optional().default(0),
  color: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const accounts = await prisma.account.findMany({
      where: { familyId: session.id },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        type: true,
        role: true,
        balance: true,
        color: true,
      },
    })

    return NextResponse.json({
      data: accounts.map((a) => ({ ...a, balance: Number(a.balance) })),
    })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = createAccountSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const account = await prisma.account.create({
      data: {
        familyId: session.id,
        name: parsed.data.name,
        type: parsed.data.type,
        role: parsed.data.role,
        balance: parsed.data.balance,
        color: parsed.data.color,
      },
      select: { id: true, name: true, type: true, role: true, balance: true, color: true },
    })

    return NextResponse.json({ data: { ...account, balance: Number(account.balance) } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
