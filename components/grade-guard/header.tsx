"use client"

import { Bell, GraduationCap, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                GradeGuard
              </span>
              <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px] font-medium">
                Spring term
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              Academic progress dashboard for course recovery planning
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <div className="rounded-full border border-border/80 bg-card px-3 py-2 text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Last sync
            </p>
            <p className="text-sm font-medium text-foreground">Today at 8:14 AM</p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button size="sm" className="rounded-full px-4">
            <ShieldCheck className="h-4 w-4" />
            Review alerts
          </Button>
        </div>
      </div>
    </header>
  )
}
