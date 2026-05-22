"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Insight {
  id: string
  type: string
  category: string | null
  title: string
  body: string
  severity: "INFO" | "WARNING" | "CRITICAL"
  month: string
  isRead: boolean
  createdAt: string
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

const SEVERITY_LABEL: Record<string, string> = {
  CRITICAL: "Kritis",
  WARNING: "Waspada",
  INFO: "Info",
}

const SEVERITY_VARIANT: Record<string, "destructive" | "secondary" | "outline"> = {
  CRITICAL: "destructive",
  WARNING: "secondary",
  INFO: "outline",
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const month = currentMonthKey()

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/insights?month=${month}`)
    if (res.ok) {
      const json = await res.json() as { data: Insight[] }
      setInsights(json.data)
    }
    setLoading(false)
  }, [month])

  useEffect(() => { fetchInsights() }, [fetchInsights])

  async function markRead(id: string) {
    await fetch(`/api/insights/${id}`, { method: "PATCH" })
    setInsights((prev) => prev.map((i) => i.id === id ? { ...i, isRead: true } : i))
  }

  const critical = insights.filter((i) => i.severity === "CRITICAL")
  const warning = insights.filter((i) => i.severity === "WARNING")
  const info = insights.filter((i) => i.severity === "INFO")

  function InsightList({ items }: { items: Insight[] }) {
    if (items.length === 0) return (
      <p className="text-sm text-muted-foreground py-4 text-center">Tidak ada insight untuk kategori ini.</p>
    )
    return (
      <div className="space-y-3">
        {items.map((insight, i) => (
          <div key={insight.id}>
            {i > 0 && <Separator />}
            <div
              className={`pt-3 cursor-pointer hover:bg-muted/50 rounded-lg p-3 transition-colors ${insight.isRead ? "opacity-50" : ""}`}
              onClick={() => !insight.isRead && markRead(insight.id)}
            >
              <div className="flex items-start gap-3">
                <Badge variant={SEVERITY_VARIANT[insight.severity]} className="shrink-0 mt-0.5 text-xs">
                  {SEVERITY_LABEL[insight.severity]}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.body}</p>
                  {insight.category && (
                    <Badge variant="outline" className="mt-2 text-xs">{insight.category}</Badge>
                  )}
                </div>
                {!insight.isRead && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-muted-foreground text-sm">Analisis ML keuangan kamu bulan ini</p>
      </div>

      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Memuat insight...</CardContent></Card>
      ) : insights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">Belum ada insight bulan ini.</p>
            <p className="text-xs text-muted-foreground mt-1">Insight dibuat otomatis setiap malam berdasarkan data keuangan kamu.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">Semua ({insights.length})</TabsTrigger>
            <TabsTrigger value="critical" className="text-red-600">Kritis ({critical.length})</TabsTrigger>
            <TabsTrigger value="warning">Waspada ({warning.length})</TabsTrigger>
            <TabsTrigger value="info">Info ({info.length})</TabsTrigger>
          </TabsList>

          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Insight Bulan Ini</CardTitle>
              <CardDescription className="text-xs">Klik insight untuk menandai sudah dibaca</CardDescription>
            </CardHeader>
            <CardContent>
              <TabsContent value="all"><InsightList items={insights} /></TabsContent>
              <TabsContent value="critical"><InsightList items={critical} /></TabsContent>
              <TabsContent value="warning"><InsightList items={warning} /></TabsContent>
              <TabsContent value="info"><InsightList items={info} /></TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      )}
    </div>
  )
}
