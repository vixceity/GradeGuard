"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import type { RecoveryPlanData } from "@/types/grade"

interface RecoveryPlanProps {
  isReady?: boolean
  planData?: RecoveryPlanData | null
  onPlanGenerated?: (plan: RecoveryPlanData) => void
}

export function RecoveryPlan({
  isReady = false,
  planData = null,
  onPlanGenerated,
}: RecoveryPlanProps) {
  const [plan, setPlan] = useState<RecoveryPlanData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    setPlan(null)
  }, [planData])

  const handleGenerate = async () => {
    if (!planData) {
      return
    }

    setIsGenerating(true)
    setPlan(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 300))

      setPlan(planData)
      onPlanGenerated?.(planData)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="gap-3 pb-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Recovery Plan</CardTitle>
          <CardDescription className="text-sm leading-6">
            Turn the target-grade review into a short sequence of concrete actions.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isReady ? (
          <div className="rounded-2xl border border-dashed border-border/90 bg-muted/25 px-5 py-8 text-center">
            <p className="text-sm font-medium text-foreground">Plan generation locked</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Run the outlook review first so the plan reflects the actual target-grade path.
            </p>
          </div>
        ) : !plan && !isGenerating ? (
          <div className="rounded-2xl border border-border/80 bg-muted/20 px-5 py-6">
            <p className="text-sm font-medium text-foreground">Build a focused recovery sequence</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Generate a short plan centered on the highest-impact assignments and the average
              required to stay on target.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={!planData}
              className="mt-4 w-full rounded-full sm:w-auto"
            >
              Generate plan
            </Button>
          </div>
        ) : isGenerating ? (
          <div className="rounded-2xl border border-border/80 bg-muted/20 px-5 py-8 text-center">
            <Spinner className="mx-auto h-5 w-5" />
            <p className="mt-3 text-sm text-muted-foreground">Generating plan...</p>
          </div>
        ) : plan ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  Target {plan.targetGrade}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {plan.confidence}% confidence
                </span>
              </div>
              <Button variant="outline" onClick={handleGenerate} className="rounded-full px-4">
                Refresh plan
              </Button>
            </div>

            <ol className="space-y-3">
              {plan.steps.map(({ step, action, detail }) => (
                <li
                  key={step}
                  className="flex gap-3 rounded-xl border border-border/80 bg-card px-4 py-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
                    {step}
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{action}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </>
        ) : null
        }
      </CardContent>
    </Card>
  )
}
