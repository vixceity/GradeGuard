"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface Assignment {
  id: string
  name: string
  impact: "high" | "medium" | "low"
  gradeChange: number
  category: string
}

const mockAssignments: Assignment[] = [
  { id: "1", name: "Final Exam", impact: "high", gradeChange: 20, category: "Exams" },
  { id: "2", name: "Unit Test 3", impact: "high", gradeChange: 12, category: "Exams" },
  { id: "3", name: "Midterm Corrections", impact: "medium", gradeChange: 8, category: "Exams" },
  { id: "4", name: "Homework Packet 5", impact: "low", gradeChange: 2, category: "Homework" },
  { id: "5", name: "Quiz 6", impact: "low", gradeChange: 2, category: "Quizzes" },
]

interface ImpactRankingProps {
  assignments?: Assignment[]
}

export function ImpactRanking({ assignments = mockAssignments }: ImpactRankingProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Assignment Impact</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="pb-2 font-medium">Assignment</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium text-center w-20">Impact</th>
              <th className="pb-2 font-medium text-right w-16">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assignments.map((a) => (
              <tr key={a.id}>
                <td className="py-2 font-medium">{a.name}</td>
                <td className="py-2 text-muted-foreground">{a.category}</td>
                <td className="py-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    a.impact === "high" 
                      ? "bg-green-50 text-green-700" 
                      : a.impact === "medium" 
                      ? "bg-amber-50 text-amber-700" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {a.impact.charAt(0).toUpperCase() + a.impact.slice(1)}
                  </span>
                </td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">
                  +{a.gradeChange}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
