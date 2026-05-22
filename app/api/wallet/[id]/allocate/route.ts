import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const allocationSchema = z.object({
  allocations: z.array(
    z.object({
      accountId: z.string().min(1),
      amount: z.number().positive(),
      purpose: z.string().min(1).max(200),
    })
  ).min(1),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const parsed = allocationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const entry = await prisma.walletEntry.findFirst({
      where: { id, familyId: session.id },
    })
    if (!entry) return NextResponse.json({ error: "Wallet entry tidak ditemukan" }, { status: 404 })
    if (entry.isAllocated) return NextResponse.json({ error: "Entry sudah dialokasikan" }, { status: 409 })

    const totalAllocated = parsed.data.allocations.reduce((s, a) => s + a.amount, 0)
    if (totalAllocated > Number(entry.amount)) {
      return NextResponse.json({
        error: `Total alokasi (${totalAllocated}) melebihi jumlah entry (${Number(entry.amount)})`,
      }, { status: 400 })
    }

    // Validate all accounts belong to this family
    const accountIds = parsed.data.allocations.map((a) => a.accountId)
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, familyId: session.id },
      select: { id: true },
    })
    if (accounts.length !== accountIds.length) {
      return NextResponse.json({ error: "Satu atau lebih akun tidak ditemukan" }, { status: 404 })
    }

    const createdAllocations = await prisma.$transaction(
      parsed.data.allocations.map((a) =>
        prisma.walletAllocation.create({
          data: {
            walletEntryId: id,
            accountId: a.accountId,
            amount: a.amount,
            purpose: a.purpose,
          },
        })
      )
    )

    await prisma.$transaction([
      prisma.walletEntry.update({
        where: { id },
        data: { isAllocated: true },
      }),
      ...parsed.data.allocations.map((a) =>
        prisma.account.update({
          where: { id: a.accountId },
          data: { balance: { increment: a.amount } },
        })
      ),
    ])

    return NextResponse.json({
      data: {
        allocations: createdAllocations.map((a) => ({ ...a, amount: Number(a.amount) })),
        isAllocated: true,
      },
    })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
