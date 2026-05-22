import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { formatRupiah } from "@/lib/currency"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

function monthKey(offset = 0) {
  const now = new Date()
  now.setMonth(now.getMonth() + offset)
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number) as [number, number]
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })
}

async function getReportData(familyId: string) {
  const month = monthKey(0)
  const prevMonth = monthKey(-1)

  const [report, prevReport] = await Promise.all([
    prisma.monthlyReport.findUnique({ where: { familyId_month: { familyId, month } } }),
    prisma.monthlyReport.findUnique({ where: { familyId_month: { familyId, month: prevMonth } } }),
  ])

  // Jika belum ada report, hitung langsung dari DB
  if (!report) {
    const [y, m] = month.split("-").map(Number) as [number, number]
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0, 23, 59, 59)

    const [incomeEntries, expenses, debts, assets, goals] = await Promise.all([
      prisma.incomeEntry.findMany({ where: { income: { familyId }, date: { gte: start, lte: end } }, select: { amount: true } }),
      prisma.dailyExpense.findMany({ where: { familyId, date: { gte: start, lte: end } }, select: { amount: true, isConsumptive: true } }),
      prisma.debt.findMany({ where: { familyId }, select: { remainingAmount: true } }),
      prisma.asset.findMany({ where: { familyId }, select: { value: true } }),
      prisma.savingsGoal.findMany({ where: { familyId }, select: { currentAmount: true } }),
    ])

    const totalIncome = incomeEntries.reduce((s, e) => s + Number(e.amount), 0)
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0)
    const totalDebt = debts.reduce((s, d) => s + Number(d.remainingAmount), 0)
    const totalAssets = assets.reduce((s, a) => s + Number(a.value), 0)
    const totalSavings = goals.reduce((s, g) => s + Number(g.currentAmount), 0)
    const consumptiveCount = expenses.filter((e) => e.isConsumptive).reduce((s, e) => s + Number(e.amount), 0)
    const consumptiveRate = totalExpense > 0 ? consumptiveCount / totalExpense : 0

    return {
      month,
      prevMonth,
      totalIncome,
      totalExpense,
      totalSaved: Math.max(0, totalIncome - totalExpense),
      netWorth: totalAssets + totalSavings - totalDebt,
      healthScore: null as number | null,
      consumptiveRate,
      prevReport,
    }
  }

  return {
    month,
    prevMonth,
    totalIncome: Number(report.totalIncome),
    totalExpense: Number(report.totalExpense),
    totalSaved: Number(report.totalSaved),
    netWorth: Number(report.netWorth),
    healthScore: report.healthScore,
    consumptiveRate: Number(report.consumptiveRate),
    prevReport,
  }
}

function diffBadge(current: number, prev: number | undefined) {
  if (prev === undefined || prev === 0) return null
  const pct = Math.round(((current - prev) / Math.abs(prev)) * 100)
  if (pct === 0) return null
  const isUp = pct > 0
  return (
    <Badge variant={isUp ? "secondary" : "outline"} className="text-xs ml-2">
      {isUp ? "▲" : "▼"} {Math.abs(pct)}%
    </Badge>
  )
}

export default async function LaporanPage() {
  const session = await getSession()
  if (!session) redirect("/masuk")

  const data = await getReportData(session.id)
  const savingRate = data.totalIncome > 0 ? (data.totalSaved / data.totalIncome) * 100 : 0
  const consumptivePct = Math.round(data.consumptiveRate * 100)

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Laporan Bulanan</h1>
        <p className="text-muted-foreground text-sm">{monthLabel(data.month)}</p>
      </div>

      {/* Summary 4 cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Pemasukan", value: data.totalIncome, prev: data.prevReport ? Number(data.prevReport.totalIncome) : undefined },
          { label: "Pengeluaran", value: data.totalExpense, prev: data.prevReport ? Number(data.prevReport.totalExpense) : undefined },
          { label: "Tersimpan", value: data.totalSaved, prev: data.prevReport ? Number(data.prevReport.totalSaved) : undefined },
          { label: "Net Worth", value: data.netWorth, prev: data.prevReport ? Number(data.prevReport.netWorth) : undefined },
        ].map(({ label, value, prev }) => (
          <Card key={label}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardDescription className="text-xs">{label}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={`text-lg font-bold ${value < 0 ? "text-red-600" : ""}`}>{formatRupiah(value)}</p>
              {diffBadge(value, prev)}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Health Score */}
      {data.healthScore !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial Health Score</CardTitle>
            <CardDescription className="text-xs">Bulan {monthLabel(data.month)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold">{data.healthScore}</span>
              <span className="text-muted-foreground">/100</span>
              <Badge variant={data.healthScore >= 70 ? "secondary" : data.healthScore >= 50 ? "outline" : "destructive"}>
                {data.healthScore >= 85 ? "Sangat Sehat" : data.healthScore >= 70 ? "Sehat" : data.healthScore >= 50 ? "Aman" : data.healthScore >= 30 ? "Waspada" : "Kritis"}
              </Badge>
            </div>
            <Progress value={data.healthScore} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Saving Rate & Consumptive */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saving Rate</CardTitle>
            <CardDescription className="text-xs">Target ideal ≥ 20%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{savingRate.toFixed(1)}%</span>
              <span className="text-muted-foreground text-sm mb-1">dari income</span>
            </div>
            <Progress value={Math.min(savingRate, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {savingRate < 10 ? "Perlu ditingkatkan — coba kurangi pengeluaran konsumtif" :
               savingRate < 20 ? "Cukup baik — targetkan 20% untuk lebih aman" :
               "Sangat baik! Pertahankan kebiasaan ini"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pengeluaran Konsumtif</CardTitle>
            <CardDescription className="text-xs">Target ideal &lt; 20%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-bold ${consumptivePct > 30 ? "text-red-600" : consumptivePct > 20 ? "text-yellow-600" : "text-green-600"}`}>
                {consumptivePct}%
              </span>
              <span className="text-muted-foreground text-sm mb-1">dari pengeluaran</span>
            </div>
            <Progress value={Math.min(consumptivePct, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {consumptivePct > 30 ? "Terlalu tinggi — identifikasi kategori terbesar dan kurangi" :
               consumptivePct > 20 ? "Perlu perhatian — masih bisa dikurangi lebih lanjut" :
               "Dalam batas baik — pertahankan!"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Perbandingan bulan lalu */}
      {data.prevReport && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">vs Bulan Lalu</CardTitle>
            <CardDescription className="text-xs">{monthLabel(data.prevMonth)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Pemasukan", curr: data.totalIncome, prev: Number(data.prevReport.totalIncome) },
              { label: "Pengeluaran", curr: data.totalExpense, prev: Number(data.prevReport.totalExpense) },
              { label: "Tersimpan", curr: data.totalSaved, prev: Number(data.prevReport.totalSaved) },
            ].map(({ label, curr, prev }) => {
              const diff = curr - prev
              const isPositive = label === "Pengeluaran" ? diff < 0 : diff > 0
              return (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{formatRupiah(prev)}</span>
                    <span>→</span>
                    <span className="font-medium">{formatRupiah(curr)}</span>
                    <Badge variant={isPositive ? "secondary" : "destructive"} className="text-xs">
                      {diff > 0 ? "+" : ""}{formatRupiah(diff)}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
