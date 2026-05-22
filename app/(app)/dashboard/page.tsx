import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { formatRupiah, formatCompact } from "@/lib/currency"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

async function getDashboardData(familyId: string) {
  const month = currentMonthKey()
  const [year, mon] = month.split("-").map(Number) as [number, number]
  const startOfMonth = new Date(year, mon - 1, 1)
  const endOfMonth = new Date(year, mon, 0, 23, 59, 59)

  const [
    incomeEntries,
    expenses,
    debts,
    savingsGoals,
    assets,
    bills,
    insights,
    accounts,
  ] = await Promise.all([
    prisma.incomeEntry.findMany({
      where: { income: { familyId }, date: { gte: startOfMonth, lte: endOfMonth } },
      select: { amount: true },
    }),
    prisma.dailyExpense.findMany({
      where: { familyId, date: { gte: startOfMonth, lte: endOfMonth } },
      select: { amount: true, category: true, date: true },
    }),
    prisma.debt.findMany({
      where: { familyId },
      select: { id: true, name: true, type: true, remainingAmount: true, monthlyPayment: true, dueDay: true, remainingMonths: true },
    }),
    prisma.savingsGoal.findMany({
      where: { familyId },
      select: { name: true, currentAmount: true, targetAmount: true, monthlyContrib: true },
    }),
    prisma.asset.findMany({
      where: { familyId },
      select: { value: true },
    }),
    prisma.bill.findMany({
      where: { familyId, isActive: true },
      select: { id: true, name: true, amount: true, dueDay: true },
    }),
    prisma.insight.findMany({
      where: { familyId, month },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      take: 3,
      select: { id: true, title: true, body: true, severity: true, type: true },
    }),
    prisma.account.findMany({
      where: { familyId },
      select: { balance: true },
    }),
  ])

  const billIds = bills.map((b) => b.id)
  const paidBills = await prisma.billPayment.findMany({
    where: { billId: { in: billIds }, month },
    select: { billId: true, paidAt: true },
  })

  const totalIncome = incomeEntries.reduce((s, e) => s + Number(e.amount), 0)
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalDebt = debts.reduce((s, d) => s + Number(d.remainingAmount), 0)
  const totalAssets = assets.reduce((s, a) => s + Number(a.value), 0)
  const totalSavings = savingsGoals.reduce((s, g) => s + Number(g.currentAmount), 0)
  const accountBalance = accounts.reduce((s, a) => s + Number(a.balance), 0)
  const netWorth = totalAssets + totalSavings + accountBalance - totalDebt
  const sisa = totalIncome - totalExpense

  const paidBillIds = new Set(paidBills.filter((p) => p.paidAt).map((p) => p.billId))
  const unpaidBills = bills.filter((b) => !paidBillIds.has(b.id))

  // Runway: sisa uang / rata-rata pengeluaran
  const monthlyAvgExpense = totalExpense > 0 ? totalExpense : 1
  const runway = accountBalance > 0 ? Math.floor(accountBalance / monthlyAvgExpense) : 0

  return {
    totalIncome,
    totalExpense,
    sisa,
    netWorth,
    debts,
    totalDebt,
    savingsGoals,
    unpaidBills,
    insights,
    runway,
    month,
  }
}

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "destructive",
  WARNING: "secondary",
  INFO: "outline",
}

const DEBT_TYPE_COLOR: Record<string, string> = {
  PINJOL: "destructive",
  KPR: "secondary",
  KKB: "outline",
  PERSONAL: "outline",
  OTHER: "outline",
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/masuk")

  const data = await getDashboardData(session.id)

  const [year, mon] = data.month.split("-").map(Number) as [number, number]
  const monthName = new Date(year, mon - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">{monthName}</p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs">Pemasukan</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-lg font-bold text-green-600">{formatCompact(data.totalIncome)}</p>
            <p className="text-xs text-muted-foreground">{formatRupiah(data.totalIncome)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs">Pengeluaran</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-lg font-bold text-red-600">{formatCompact(data.totalExpense)}</p>
            <p className="text-xs text-muted-foreground">{formatRupiah(data.totalExpense)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs">Sisa Uang</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className={`text-lg font-bold ${data.sisa >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCompact(Math.abs(data.sisa))}
            </p>
            <p className="text-xs text-muted-foreground">{formatRupiah(data.sisa)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs">Net Worth</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className={`text-lg font-bold ${data.netWorth >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCompact(Math.abs(data.netWorth))}
            </p>
            <p className="text-xs text-muted-foreground">{formatRupiah(data.netWorth)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Chart placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Arus Uang Bulan Ini</CardTitle>
            <CardDescription className="text-xs">Sankey chart akan ditampilkan di sini</CardDescription>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-md">
            {/* Chart: SankeyChart — import dari @/components/charts/SankeyChart */}
            Sankey Chart
          </CardContent>
        </Card>

        {/* Runway Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Runway Keuangan</CardTitle>
            <CardDescription className="text-xs">Estimasi bertahan dengan saldo saat ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <p className="text-4xl font-bold">{data.runway}</p>
              <p className="text-sm text-muted-foreground">bulan lagi</p>
            </div>
            <Progress value={Math.min((data.runway / 6) * 100, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Target ideal: 6 bulan dana darurat
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Debt countdown */}
        {data.debts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hutang Aktif</CardTitle>
              <CardDescription className="text-xs">Total: {formatRupiah(data.totalDebt)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.debts.slice(0, 3).map((debt) => {
                const pct = Math.max(0, Math.min(100, 100 - (Number(debt.remainingAmount) / 1) * 0))
                return (
                  <div key={debt.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{debt.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={DEBT_TYPE_COLOR[debt.type] as "destructive" | "secondary" | "outline" ?? "outline"} className="text-xs">
                          {debt.type}
                        </Badge>
                        <span className="text-muted-foreground">{debt.remainingMonths} bln</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sisa {formatRupiah(Number(debt.remainingAmount))} · cicilan {formatRupiah(Number(debt.monthlyPayment))}/bln
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Bill Calendar mini */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tagihan Belum Bayar</CardTitle>
            <CardDescription className="text-xs">Bulan {monthName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.unpaidBills.length === 0 ? (
              <p className="text-sm text-green-600 font-medium">Semua tagihan sudah lunas ✓</p>
            ) : (
              data.unpaidBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between text-sm">
                  <span>{bill.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">tgl {bill.dueDay}</span>
                    <span className="font-medium text-red-600">{formatRupiah(Number(bill.amount))}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Insight Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.insights.map((insight, i) => (
              <div key={insight.id}>
                {i > 0 && <Separator className="mb-3" />}
                <div className="flex gap-3">
                  <Badge
                    variant={SEVERITY_COLOR[insight.severity] as "destructive" | "secondary" | "outline" ?? "outline"}
                    className="shrink-0 h-fit text-xs"
                  >
                    {insight.severity}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
