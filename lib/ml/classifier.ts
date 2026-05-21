type Classification = "NECESSARY" | "CONSUMPTIVE" | "MIXED"

interface ClassifyRule {
  type: Classification
  threshold?: number // jika amount > threshold → consumptive
  alwaysConsumptive?: boolean
}

const RULES: Record<string, ClassifyRule> = {
  FOOD: { type: "MIXED", threshold: 50_000 },
  TRANSPORT_CAR: { type: "MIXED", threshold: 100_000 },
  TRANSPORT_MOTOR: { type: "NECESSARY" },
  GROCERY: { type: "MIXED", threshold: 700_000 },
  HEALTH: { type: "NECESSARY" },
  EDUCATION: { type: "NECESSARY" },
  ENTERTAINMENT: { type: "CONSUMPTIVE", alwaysConsumptive: true },
  SOCIAL: { type: "MIXED", threshold: 100_000 },
  BILLS: { type: "NECESSARY" },
  OTHER: { type: "MIXED", threshold: 50_000 },
}

export interface ClassifierResult {
  isConsumptive: boolean
  score: number // 0-1, makin tinggi makin konsumtif
  reason: string
}

export function classifyExpense(
  category: string,
  amount: number
): ClassifierResult {
  const rule = RULES[category] ?? RULES.OTHER

  if (rule.alwaysConsumptive) {
    return { isConsumptive: true, score: 0.9, reason: "Kategori hiburan/non-esensial" }
  }

  if (rule.type === "NECESSARY") {
    return { isConsumptive: false, score: 0.1, reason: "Kebutuhan esensial" }
  }

  if (rule.threshold && amount > rule.threshold) {
    const ratio = Math.min((amount - rule.threshold) / rule.threshold, 1)
    const score = 0.5 + ratio * 0.4
    return {
      isConsumptive: true,
      score: parseFloat(score.toFixed(3)),
      reason: `Melebihi batas wajar Rp ${rule.threshold.toLocaleString("id-ID")}`,
    }
  }

  return { isConsumptive: false, score: 0.2, reason: "Dalam batas normal" }
}

export function calcConsumptiveRate(
  expenses: { amount: number; isConsumptive: boolean | null }[]
): number {
  if (expenses.length === 0) return 0
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const consumptive = expenses
    .filter((e) => e.isConsumptive)
    .reduce((s, e) => s + e.amount, 0)
  return total === 0 ? 0 : consumptive / total
}
