"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/grade-guard/header"
import { SyllabusInput } from "@/components/grade-guard/syllabus-input"
import { GradeOverview } from "@/components/grade-guard/grade-overview"
import { CookedChecker, type CookedAnalysis } from "@/components/grade-guard/cooked-checker"
import { WhatIfSimulator } from "@/components/grade-guard/what-if-simulator"
import { ImpactRanking } from "@/components/grade-guard/impact-ranking"
import { RecoveryPlan } from "@/components/grade-guard/recovery-plan"
import { AlertTriangle, BookOpenText, CheckCircle2, Target } from "lucide-react"

interface GradeCategory {
  id: string
  name: string
  weight: number
}

export default function GradeGuardDashboard() {
  const [categories, setCategories] = useState<GradeCategory[]>([])
  const [currentGrade] = useState(78)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [targetGrade] = useState("B")

  const handleAnalysisComplete = (_analysis: CookedAnalysis) => {
    setHasAnalyzed(true)
  }

  const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0)
  const isCourseConfigured = categories.length > 0
  const summaryCards = [
    {
      label: "Current standing",
      value: `${currentGrade}%`,
      detail: "C average",
      icon: Target,
    },
    {
      label: "Target grade",
      value: targetGrade,
      detail: hasAnalyzed ? "Reality check available" : "Awaiting review",
      icon: CheckCircle2,
    },
    {
      label: "Grade categories",
      value: String(categories.length).padStart(2, "0"),
      detail: isCourseConfigured ? `${totalWeight}% weighted` : "No weighting imported",
      icon: BookOpenText,
    },
    {
      label: "Risk status",
      value: hasAnalyzed ? "Monitored" : "Needs review",
      detail: hasAnalyzed ? "Recovery tools unlocked" : "Run outlook analysis next",
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-[28px] border border-border/70 bg-card px-5 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_64px_rgba(15,23,42,0.08)] sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.12em] uppercase">
                Dashboard
              </Badge>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Keep course performance visible and actionable.
                </h1>
                <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                  Import your grading policy, check whether your target is still realistic,
                  and focus on the assignments that change your outcome the most.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={isCourseConfigured ? "secondary" : "outline"} className="rounded-full px-3 py-1.5 text-xs font-medium">
                {isCourseConfigured ? "Course setup in progress" : "Upload syllabus to begin"}
              </Badge>
              <Badge variant={hasAnalyzed ? "secondary" : "outline"} className="rounded-full px-3 py-1.5 text-xs font-medium">
                {hasAnalyzed ? "Outlook reviewed" : "Outlook not reviewed"}
              </Badge>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ label, value, detail, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-border/80 bg-card px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_24px_rgba(15,23,42,0.05)]"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{detail}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
          <SyllabusInput
            categories={categories}
            onCategoriesChange={setCategories}
          />
          <GradeOverview currentGrade={currentGrade} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <CookedChecker
            currentGrade={currentGrade}
            targetGrade={targetGrade}
            isReady={isCourseConfigured}
            onAnalysisComplete={handleAnalysisComplete}
          />
          <RecoveryPlan isReady={hasAnalyzed} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.95fr)]">
          <ImpactRanking isReady={hasAnalyzed} />
          <WhatIfSimulator isReady={hasAnalyzed} />
        </section>
      </main>
    </div>
  )
}
