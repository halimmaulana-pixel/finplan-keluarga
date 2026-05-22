import { Check } from 'lucide-react'

interface Step {
  label: string
}

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  steps: Step[]
}

export default function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / Math.max(totalSteps - 1, 1)) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <ol className="flex items-start justify-between gap-2">
        {steps.slice(0, totalSteps).map((step, idx) => {
          const stepNum = idx + 1
          const isCompleted = stepNum < currentStep
          const isCurrent = stepNum === currentStep

          return (
            <li key={idx} className="flex flex-1 flex-col items-center gap-1.5">
              {/* Circle */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-300 ${
                  isCompleted
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : isCurrent
                    ? 'border-blue-500 bg-white text-blue-600'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
              </div>

              {/* Label */}
              <span
                className={`text-center text-[11px] leading-tight ${
                  isCompleted || isCurrent ? 'font-medium text-gray-700' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
