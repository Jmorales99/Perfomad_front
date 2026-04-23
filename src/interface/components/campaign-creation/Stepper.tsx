import { Check } from "lucide-react"

export interface Step {
  key: string
  label: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentIndex: number
  /** Index of the last step the user has successfully completed so far. */
  maxReachedIndex: number
  onStepClick?: (index: number) => void
}

export default function Stepper({
  steps,
  currentIndex,
  maxReachedIndex,
  onStepClick,
}: StepperProps) {
  return (
    <nav aria-label="Progreso" className="mb-6">
      <ol className="flex items-center">
        {steps.map((step, idx) => {
          const isComplete = idx < currentIndex
          const isCurrent = idx === currentIndex
          const isReachable = idx <= maxReachedIndex
          const isLast = idx === steps.length - 1

          return (
            <li key={step.key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
              <button
                type="button"
                onClick={() => isReachable && onStepClick?.(idx)}
                disabled={!isReachable}
                className={`flex items-center gap-2 group ${
                  isReachable ? "cursor-pointer" : "cursor-not-allowed"
                }`}
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0 transition ${
                    isComplete
                      ? "bg-blue-600 text-white"
                      : isCurrent
                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                        : isReachable
                          ? "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                          : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isComplete ? <Check className="w-4 h-4" /> : idx + 1}
                </span>
                <span className="hidden sm:flex flex-col items-start text-left">
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? "text-blue-600" : isReachable ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="text-[10px] text-gray-400">{step.description}</span>
                  )}
                </span>
              </button>
              {!isLast && (
                <div
                  className={`h-0.5 flex-1 mx-2 sm:mx-3 transition ${
                    isComplete ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
