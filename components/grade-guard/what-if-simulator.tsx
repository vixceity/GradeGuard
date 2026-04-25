"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

export interface SimulationResult {
  projectedGrade: number
  letterGrade: string
  improvement: number
}

export function WhatIfSimulator() {
  const [nextExam, setNextExam] = useState(85)
  const [finalExam, setFinalExam] = useState(80)
  const [homeworkAvg, setHomeworkAvg] = useState(90)

  const baseGrade = 78

  const simulation = useMemo<SimulationResult>(() => {
    const projectedGrade = Math.round(
      nextExam * 0.12 + finalExam * 0.20 + homeworkAvg * 0.10 + baseGrade * 0.58
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
      improvement: projectedGrade - baseGrade
    }
  }, [nextExam, finalExam, homeworkAvg])

  const sliders = [
    { label: "Next Exam", value: nextExam, onChange: setNextExam, weight: "12%" },
    { label: "Final Exam", value: finalExam, onChange: setFinalExam, weight: "20%" },
    { label: "Homework", value: homeworkAvg, onChange: setHomeworkAvg, weight: "10%" },
  ]

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">What-If Simulator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sliders.map(({ label, value, onChange, weight }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{label} ({weight})</span>
              <span className="font-medium tabular-nums">{value}%</span>
            </div>
            <Slider
              value={[value]}
              onValueChange={(v) => onChange(v[0])}
              min={0}
              max={100}
              step={1}
            />
          </div>
        ))}

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">Projected</span>
            <span className="text-sm text-muted-foreground">{simulation.letterGrade}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold tabular-nums">{simulation.projectedGrade}%</span>
            <span className={`text-sm font-medium tabular-nums ${
              simulation.improvement > 0 ? "text-green-600" : 
              simulation.improvement < 0 ? "text-red-600" : "text-muted-foreground"
            }`}>
              {simulation.improvement > 0 ? "+" : ""}{simulation.improvement}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
