"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { NeededScoreSummary } from "@/types/grade"

interface GradeOverviewProps {
  categoryCount: number
  currentGrade: number | null
  futureAssignmentCount: number
  neededScoreSummaries: NeededScoreSummary[]
  projectedGradeIfNoFutureDone: number | null
}

const targetThresholds = {
  A: 90,
  B: 80,
  C: 70,
}

function getScenarioText(summary?: NeededScoreSummary) {
  if (!summary) {
    return "Awaiting PDF analysis"
  }

  return `100/50/0: ${summary.scenarios["100"] ?? "n/a"}% / ${summary.scenarios["50"] ?? "n/a"}% / ${summary.scenarios["0"] ?? "n/a"}%`
}

function getTargetStatus(summary: NeededScoreSummary | undefined, target: keyof typeof targetThresholds) {
  if (!summary) {
    return "Pending"
  }

  const bestCase = summary.scenarios["100"]

  if (bestCase === null) {
    return "No future work"
  }

  if (bestCase <= 100) {
    return bestCase <= targetThresholds[target] ? "On track" : "Reachable"
  }

  if (bestCase <= 110) {
    return "Tight margin"
  }

  return "Out of range"
}

export function GradeOverview({
  categoryCount,
  currentGrade,
  futureAssignmentCount,
  neededScoreSummaries,
  projectedGradeIfNoFutureDone,
}: GradeOverviewProps) {
  const getLetterGrade = (grade: number) => {
    if (grade >= 90) return "A"
    if (grade >= 80) return "B"
    if (grade >= 70) return "C"
    if (grade >= 60) return "D"
    return "F"
  }

  const targets = ["C", "B", "A"].map((letter) => {
    const summary = neededScoreSummaries.find((item) => item.target === letter)

    return {
      letter,
      scenarioText: getScenarioText(summary),
      status: getTargetStatus(summary, letter as keyof typeof targetThresholds),
    }
  })

  return (
    <Card className="h-full">
      <CardHeader className="gap-3 pb-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Grade Overview</CardTitle>
          <CardDescription className="text-sm leading-6">
            Use this snapshot to compare your current standing against the averages required
            for each letter-grade target.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Current course average</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight tabular-nums text-foreground">
                  {currentGrade === null ? "--" : `${currentGrade}%`}
                </span>
                {currentGrade !== null ? (
                  <span className="pb-1 text-base text-muted-foreground">
                    {getLetterGrade(currentGrade)}
                  </span>
                ) : null}
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
              {futureAssignmentCount} future assignments
            </Badge>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
              <p className="text-sm text-muted-foreground">Imported categories</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{categoryCount}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
              <p className="text-sm text-muted-foreground">Grade if future work is zero</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {projectedGradeIfNoFutureDone === null ? "--" : `${projectedGradeIfNoFutureDone}%`}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-[60px_minmax(0,1fr)_116px] items-center gap-3 px-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <span>Target</span>
            <span>Needed future scores</span>
            <span className="text-right">Status</span>
          </div>

          <div className="space-y-2">
            {targets.map((target) => (
              <div
                key={target.letter}
                className="grid grid-cols-[60px_minmax(0,1fr)_116px] items-center gap-3 rounded-xl border border-border/75 bg-card px-4 py-3"
              >
                <span className="text-lg font-semibold text-foreground">{target.letter}</span>
                <p className="text-sm leading-6 text-muted-foreground">{target.scenarioText}</p>
                <div className="flex justify-end">
                  <Badge
                    variant={target.status === "Out of range" ? "outline" : "secondary"}
                    className="w-fit rounded-full px-2.5 py-1 text-xs font-medium"
                  >
                    {target.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
