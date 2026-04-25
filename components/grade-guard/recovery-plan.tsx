"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export interface RecoveryStep {
  step: number
  action: string
  detail: string
}

export interface RecoveryPlanData {
  steps: RecoveryStep[]
  targetGrade: string
  confidence: number
}

const mockPlan: RecoveryPlanData = {
  steps: [
    { step: 1, action: "Prioritize the final exam", detail: "Carries 20% of your grade. Start two weeks early." },
    { step: 2, action: "Complete key homework", detail: "Focus on assignments under 30 minutes." },
    { step: 3, action: "Target 84% on remaining work", detail: "Secures a B and keeps A within reach." },
  ],
  targetGrade: "B",
  confidence: 78
}

interface RecoveryPlanProps {
  onPlanGenerated?: (plan: RecoveryPlanData) => void
}

export function RecoveryPlan({ onPlanGenerated }: RecoveryPlanProps) {
  const [plan, setPlan] = useState<RecoveryPlanData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setPlan(null)
    // TODO: Replace with Gemini API call
    await new Promise(resolve => setTimeout(resolve, 1200))
    setPlan(mockPlan)
    onPlanGenerated?.(mockPlan)
    setIsGenerating(false)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Recovery Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!plan && !isGenerating && (
          <div className="py-6 text-center border border-dashed border-border rounded">
            <p className="text-xs text-muted-foreground mb-3">
              Get a personalized action plan
            </p>
            <Button onClick={handleGenerate} size="sm">
              Generate Plan
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="py-6 text-center">
            <Spinner className="w-5 h-5 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Generating...</p>
          </div>
        )}

        {plan && !isGenerating && (
          <>
            <div className="flex items-center justify-between text-sm pb-2 border-b border-border">
              <span className="text-muted-foreground">Target: <span className="font-medium text-foreground">{plan.targetGrade}</span></span>
              <span className="text-muted-foreground">{plan.confidence}% confidence</span>
            </div>

            <ol className="space-y-2">
              {plan.steps.map(({ step, action, detail }) => (
                <li key={step} className="flex gap-2 text-sm">
                  <span className="flex items-center justify-center w-5 h-5 bg-muted rounded text-xs font-medium shrink-0">
                    {step}
                  </span>
                  <div>
                    <p className="font-medium">{action}</p>
                    <p className="text-xs text-muted-foreground">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Button variant="ghost" size="sm" onClick={handleGenerate} className="w-full text-xs">
              Regenerate
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
