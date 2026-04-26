"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface GradeOverviewProps {
  currentGrade: number
}

export function GradeOverview({ currentGrade }: GradeOverviewProps) {
  const targets = [
    { letter: "C", needed: 62, status: "On track" },
    { letter: "B", needed: 84, status: "Reachable" },
    { letter: "A", needed: 104, status: "Out of range" },
  ]

  const getLetterGrade = (grade: number) => {
    if (grade >= 90) return "A"
    if (grade >= 80) return "B"
    if (grade >= 70) return "C"
    if (grade >= 60) return "D"
    return "F"
  }

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
                  {currentGrade}%
                </span>
                <span className="pb-1 text-base text-muted-foreground">
                  {getLetterGrade(currentGrade)}
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
              3 assignments left
            </Badge>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
              <p className="text-sm text-muted-foreground">Target in focus</p>
              <p className="mt-1 text-lg font-semibold text-foreground">B average path</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
              <p className="text-sm text-muted-foreground">Needed on remaining work</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">84%</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-[60px_minmax(0,1fr)_96px] items-center gap-3 px-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <span>Target</span>
            <span>Likelihood</span>
            <span className="text-right">Needed avg</span>
          </div>

          <div className="space-y-2">
            {targets.map((target) => (
              <div
                key={target.letter}
                className="grid grid-cols-[60px_minmax(0,1fr)_96px] items-center gap-3 rounded-xl border border-border/75 bg-card px-4 py-3"
              >
                <span className="text-lg font-semibold text-foreground">{target.letter}</span>
                <Badge
                  variant={target.status === "Out of range" ? "outline" : "secondary"}
                  className="w-fit rounded-full px-2.5 py-1 text-xs font-medium"
                >
                  {target.status}
                </Badge>
                <span
                  className={`text-right text-sm font-medium tabular-nums ${
                    target.status === "Out of range" ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {target.needed}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
