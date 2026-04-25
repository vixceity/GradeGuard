"use client"

import { useState } from "react"
import { Header } from "@/components/grade-guard/header"
import { SyllabusInput } from "@/components/grade-guard/syllabus-input"
import { GradeOverview } from "@/components/grade-guard/grade-overview"
import { CookedChecker, type CookedAnalysis } from "@/components/grade-guard/cooked-checker"
import { WhatIfSimulator } from "@/components/grade-guard/what-if-simulator"
import { ImpactRanking } from "@/components/grade-guard/impact-ranking"
import { RecoveryPlan } from "@/components/grade-guard/recovery-plan"

interface GradeCategory {
  id: string
  name: string
  weight: number
}

export default function GradeGuardDashboard() {
  const [categories, setCategories] = useState<GradeCategory[]>([])
  const [currentGrade] = useState(78)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  const handleAnalysisComplete = (_analysis: CookedAnalysis) => {
    setHasAnalyzed(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Top Section: CTA + Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <CookedChecker 
            currentGrade={currentGrade} 
            onAnalysisComplete={handleAnalysisComplete}
          />
          <div className="lg:col-span-2">
            <GradeOverview currentGrade={currentGrade} />
          </div>
        </div>

        {/* Dashboard Grid */}
        {hasAnalyzed && (
          <div className="space-y-4">
            {/* Two Column: Syllabus + Simulator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SyllabusInput
                categories={categories}
                onCategoriesChange={setCategories}
              />
              <WhatIfSimulator />
            </div>

            {/* Two Column: Impact + Recovery */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3">
                <ImpactRanking />
              </div>
              <div className="lg:col-span-2">
                <RecoveryPlan />
              </div>
            </div>
          </div>
        )}

        {/* Pre-Analysis State */}
        {!hasAnalyzed && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Run the grade check to unlock the full dashboard.
          </div>
        )}
      </main>
    </div>
  )
}
