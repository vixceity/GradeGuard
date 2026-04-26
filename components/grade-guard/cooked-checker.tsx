"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"

export interface CookedAnalysis {
  message: string
  targetGrade: string
  status: "safe" | "possible" | "stretch" | "unlikely"
  requiredAverage: number
  focusArea: string
}

const mockAnalysis: CookedAnalysis = {
  message:
    "A B is still realistic if the remaining high-weight assignments stay above your current trend.",
  targetGrade: "B",
  status: "possible",
  requiredAverage: 84,
  focusArea: "Final Exam",
}

const statusLabels = {
  safe: "On track",
  possible: "Reachable",
  stretch: "Tight margin",
  unlikely: "Out of range",
}

interface CookedCheckerProps {
  currentGrade?: number
  targetGrade?: string
  isReady?: boolean
  onAnalysisComplete?: (analysis: CookedAnalysis) => void
}

export function CookedChecker({
  currentGrade = 78,
  targetGrade = "B",
  isReady = false,
  onAnalysisComplete,
}: CookedCheckerProps) {
  const [analysis, setAnalysis] = useState<CookedAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getLetterGrade = (grade: number) => {
    if (grade >= 90) return "A"
    if (grade >= 80) return "B"
    if (grade >= 70) return "C"
    if (grade >= 60) return "D"
    return "F"
  }

  const handleCheck = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setAnalysis(mockAnalysis)
    onAnalysisComplete?.(mockAnalysis)
    setIsLoading(false)
  }

  return (
    <Card className="h-full">
      <CardHeader className="gap-3 pb-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Outlook Review</CardTitle>
          <CardDescription className="text-sm leading-6">
            Compare your current standing against the target grade and surface the average
            needed on remaining work.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-4">
            <p className="text-sm text-muted-foreground">Current grade</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {currentGrade}%{" "}
              <span className="text-base font-normal text-muted-foreground">
                {getLetterGrade(currentGrade)}
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-4">
            <p className="text-sm text-muted-foreground">Target grade</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {targetGrade}
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-4">
            <p className="text-sm text-muted-foreground">Review status</p>
            <div className="mt-3">
              <Badge variant={analysis ? "secondary" : "outline"} className="rounded-full px-3 py-1">
                {analysis ? statusLabels[analysis.status] : "Pending"}
              </Badge>
            </div>
          </div>
        </div>

        {!isReady ? (
          <div className="rounded-2xl border border-dashed border-border/90 bg-muted/25 px-5 py-8 text-center">
            <p className="text-sm font-medium text-foreground">Course setup required</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add at least one grading category before running the outlook review.
            </p>
          </div>
        ) : !analysis ? (
          <div className="rounded-2xl border border-border/80 bg-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Run a target-grade check</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  GradeGuard will estimate the average you need, flag whether the target is still
                  reasonable, and point to the most important assignment category.
                </p>
              </div>
              <Button onClick={handleCheck} disabled={isLoading} className="w-full rounded-full px-5 sm:w-auto">
                {isLoading ? (
                  <>
                    <Spinner className="h-3.5 w-3.5" />
                    Analyzing...
                  </>
                ) : (
                  "Run outlook review"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 bg-card p-5">
            <div className="flex flex-col gap-4 border-b border-border/80 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {statusLabels[analysis.status]}
                </Badge>
                <p className="text-xl font-semibold tracking-tight text-foreground">
                  {analysis.requiredAverage}% average needed for a {analysis.targetGrade}
                </p>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {analysis.message}
                </p>
              </div>
              <Button variant="outline" onClick={() => setAnalysis(null)} className="rounded-full px-5">
                Reset review
              </Button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/75 bg-muted/20 px-4 py-4">
                <p className="text-sm text-muted-foreground">Top focus area</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{analysis.focusArea}</p>
              </div>
              <div className="rounded-xl border border-border/75 bg-muted/20 px-4 py-4">
                <p className="text-sm text-muted-foreground">Recommended next step</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  Protect high-weight assessments
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
