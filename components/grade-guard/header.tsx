"use client"

import { GraduationCap } from "lucide-react"

export function Header() {
  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">GradeGuard</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Powered by Gemini
          </span>
        </div>
      </div>
    </header>
  )
}
