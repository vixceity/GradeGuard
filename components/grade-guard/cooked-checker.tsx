"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export interface CookedAnalysis {
  message: string
  targetGrade: string
  status: "safe" | "possible" | "stretch" | "unlikely"
  requiredAverage: number
  focusArea: string
}

const mockAnalysis: CookedAnalysis = {
  message: "You are not cooked for a B. You need an 84% average on remaining work. Focus on the final exam first because it has the greatest impact.",
  targetGrade: "B",
  status: "possible",
  requiredAverage: 84,
  focusArea: "Final Exam"
}

const statusLabels = {
  safe: "On Track",
  possible: "Possible",
  stretch: "Stretch",
  unlikely: "Not Possible"
}

const statusColors = {
  safe: "text-green-700 bg-green-50",
  possible: "text-blue-700 bg-blue-50",
  stretch: "text-amber-700 bg-amber-50",
  unlikely: "text-gray-500 bg-gray-100"
}

interface CookedCheckerProps {
  currentGrade?: number
  targetGrade?: string
  onAnalysisComplete?: (analysis: CookedAnalysis) => void
}

export function CookedChecker({ 
  currentGrade = 78, 
  targetGrade = "B",
  onAnalysisComplete 
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
    // TODO: Replace with Gemini API call
    await new Promise(resolve => setTimeout(resolve, 1200))
    setAnalysis(mockAnalysis)
    onAnalysisComplete?.(mockAnalysis)
    setIsLoading(false)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Grade Outlook</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current status summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Grade</span>
            <span className="text-lg font-semibold tabular-nums">
              {currentGrade}% <span className="text-muted-foreground font-normal">({getLetterGrade(currentGrade)})</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Target Grade</span>
            <span className="text-lg font-semibold">{targetGrade}</span>
          </div>
          {analysis && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColors[analysis.status]}`}>
                {statusLabels[analysis.status]}
              </span>
            </div>
          )}
        </div>

        {!analysis ? (
          <Button
            onClick={handleCheck}
            disabled={isLoading}
            className="w-full"
            size="sm"
          >
            {isLoading ? (
              <>
                <Spinner className="w-3.5 h-3.5 mr-2" />
                Analyzing...
              </>
            ) : (
              "Run Reality Check"
            )}
          </Button>
        ) : (
          <div className="space-y-3 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {analysis.message}
            </p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setAnalysis(null)} 
              className="w-full text-xs"
            >
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
