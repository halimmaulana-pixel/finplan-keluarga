import { sampleStandardDeviation, mean } from "simple-statistics"

export interface AnomalyResult {
  category: string
  currentAmount: number
  historicalMean: number
  zScore: number
  isAnomaly: boolean
  severity: "INFO" | "WARNING" | "CRITICAL"
  excessAmount: number
}

export function detectAnomalies(
  current: Record<string, number>,
  historical: Record<string, number[]>
): AnomalyResult[] {
  const results: AnomalyResult[] = []

  for (const [category, amount] of Object.entries(current)) {
    const history = historical[category]
    if (!history || history.length < 2) continue

    const avg = mean(history)
    const std = sampleStandardDeviation(history)
    if (std === 0) continue

    const zScore = (amount - avg) / std
    const isAnomaly = Math.abs(zScore) > 1.5

    let severity: AnomalyResult["severity"] = "INFO"
    if (zScore > 2.5) severity = "CRITICAL"
    else if (zScore > 1.5) severity = "WARNING"

    results.push({
      category,
      currentAmount: amount,
      historicalMean: avg,
      zScore,
      isAnomaly,
      severity,
      excessAmount: Math.max(0, amount - avg),
    })
  }

  return results.filter((r) => r.isAnomaly).sort((a, b) => b.zScore - a.zScore)
}
