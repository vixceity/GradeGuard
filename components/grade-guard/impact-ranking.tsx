"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ImpactAssignmentSummary } from "@/types/grade"

interface ImpactRankingProps {
  assignments?: ImpactAssignmentSummary[]
  isReady?: boolean
}

export function ImpactRanking({
  assignments = [],
  isReady = false,
}: ImpactRankingProps) {
  return (
    <Card className="h-full">
      <CardHeader className="gap-3 pb-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Assignment Impact</CardTitle>
          <CardDescription className="text-sm leading-6">
            Prioritize the remaining work by expected effect on the course average.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isReady ? (
          <div className="rounded-2xl border border-dashed border-border/90 bg-muted/25 px-5 py-8 text-center">
            <p className="text-sm font-medium text-foreground">Impact ranking not available yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete the outlook review first so the ranking can focus on the relevant target.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Ranking reflects assignment weight, remaining scoring opportunity, and the
                current target-grade path.
              </p>
            </div>

            {assignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/90 bg-muted/25 px-5 py-8 text-center">
                <p className="text-sm font-medium text-foreground">No future assignments inferred</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Uploads did not produce any remaining assignments to rank by impact.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-sm">
                  <thead>
                    <tr className="border-b border-border/80 text-left text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      <th className="pb-3">Assignment</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Priority</th>
                      <th className="pb-3 text-right">Potential lift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="py-4 font-medium text-foreground">{assignment.name}</td>
                        <td className="py-4 text-muted-foreground">
                          {assignment.category}
                          {assignment.extraCredit ? " · Extra credit" : ""}
                        </td>
                        <td className="py-4">
                          <Badge
                            variant={assignment.impact === "low" ? "outline" : "secondary"}
                            className="rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                          >
                            {assignment.impact}
                          </Badge>
                        </td>
                        <td className="py-4 text-right font-medium tabular-nums text-foreground">
                          +{assignment.gradeChange}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
