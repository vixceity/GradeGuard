"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GradeOverviewProps {
  currentGrade: number
}

export function GradeOverview({ currentGrade }: GradeOverviewProps) {
  const targets = [
    { letter: "C", threshold: 70, needed: 62, status: "safe" as const },
    { letter: "B", threshold: 80, needed: 84, status: "possible" as const },
    { letter: "A", threshold: 90, needed: 104, status: "impossible" as const },
  ]

  const getLetterGrade = (grade: number) => {
    if (grade >= 90) return "A"
    if (grade >= 80) return "B"
    if (grade >= 70) return "C"
    if (grade >= 60) return "D"
    return "F"
  }

  const statusLabels = {
    safe: "Safe",
    possible: "Possible",
    stretch: "Stretch",
    impossible: "Not Possible"
  }

  const statusColors = {
    safe: "text-green-700 bg-green-50",
    possible: "text-blue-700 bg-blue-50",
    stretch: "text-amber-700 bg-amber-50",
    impossible: "text-gray-400 bg-gray-100"
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Grade Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Grade</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums">{currentGrade}%</span>
              <span className="text-sm text-muted-foreground">({getLetterGrade(currentGrade)})</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className="text-sm font-medium">3 assignments</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Grade Targets
          </p>
          <div className="space-y-2">
            {targets.map((target) => (
              <div 
                key={target.letter} 
                className={`flex items-center justify-between py-2 px-3 rounded border ${
                  target.status === "impossible" 
                    ? "bg-gray-50 border-gray-200 opacity-60" 
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-base font-semibold ${
                    target.status === "impossible" ? "text-gray-400" : "text-foreground"
                  }`}>
                    {target.letter}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[target.status]}`}>
                    {statusLabels[target.status]}
                  </span>
                </div>
                <span className={`text-sm tabular-nums ${
                  target.status === "impossible" 
                    ? "text-gray-400 line-through" 
                    : "text-muted-foreground"
                }`}>
                  Need {target.needed}% avg
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
