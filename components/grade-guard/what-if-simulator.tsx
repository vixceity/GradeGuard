"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

export interface SimulationResult {
  projectedGrade: number
  letterGrade: string
  improvement: number
}

interface WhatIfSimulatorProps {
  isReady?: boolean
}

export function WhatIfSimulator({ isReady = false }: WhatIfSimulatorProps) {
  const [nextExam, setNextExam] = useState(85)
  const [finalExam, setFinalExam] = useState(80)
  const [homeworkAvg, setHomeworkAvg] = useState(90)

  const baseGrade = 78

  const simulation = useMemo<SimulationResult>(() => {
    const projectedGrade = Math.round(
      nextExam * 0.12 + finalExam * 0.2 + homeworkAvg * 0.1 + baseGrade * 0.58
    )
    const getLetterGrade = (grade: number) => {
      if (grade >= 90) return "A"
      if (grade >= 80) return "B"
      if (grade >= 70) return "C"
      if (grade >= 60) return "D"
      return "F"
    }
    return {
      projectedGrade,
      letterGrade: getLetterGrade(projectedGrade),
      improvement: projectedGrade - baseGrade,
    }
  }, [nextExam, finalExam, homeworkAvg])

  const sliders = [
    {
      label: "Next exam",
      value: nextExam,
      onChange: setNextExam,
      weight: "12% of course grade",
    },
    {
      label: "Final exam",
      value: finalExam,
      onChange: setFinalExam,
      weight: "20% of course grade",
    },
    {
      label: "Homework average",
      value: homeworkAvg,
      onChange: setHomeworkAvg,
      weight: "10% of course grade",
    },
  ]

  return (
    <Card className="h-full">
      <CardHeader className="gap-3 pb-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">What-If Simulator</CardTitle>
          <CardDescription className="text-sm leading-6">
            Adjust upcoming scores to see how much movement remains in the course average.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isReady ? (
          <div className="rounded-2xl border border-dashed border-border/90 bg-muted/25 px-5 py-8 text-center">
            <p className="text-sm font-medium text-foreground">Outlook review required</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Run the outlook review to unlock scenario planning for the remaining work.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Projected course average</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                    {simulation.projectedGrade}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Projected letter</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    {simulation.letterGrade}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-border/75 bg-card px-4 py-3">
                <span className="text-sm text-muted-foreground">Change from current average</span>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    simulation.improvement > 0
                      ? "text-green-700"
                      : simulation.improvement < 0
                        ? "text-red-700"
                        : "text-muted-foreground"
                  }`}
                >
                  {simulation.improvement > 0 ? "+" : ""}
                  {simulation.improvement}%
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {sliders.map(({ label, value, onChange, weight }) => (
                <div key={label} className="space-y-2">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground">{weight}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {value}%
                    </span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={(nextValue) => onChange(nextValue[0])}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
