import { NextResponse } from 'next/server'

import { parseFutureAssignments, parseGrades, parseGrading } from '@/lib/gradeAi'
import {
  calculateGradeFromJson,
  calculateGradeIfNoFutureDone,
  gradeEstimate,
  normalizeWeights,
  summarizeNeededScores,
} from '@/lib/gradeMath'
import { extractText } from '@/lib/pdf'
import type { Assignment, CourseAnalysisResponse, ParsedAssignment, Weight } from '@/types/grade'

export const runtime = 'nodejs'

function getPdfFile(formData: FormData, keys: string[]) {
  for (const key of keys) {
    const value = formData.get(key)
    if (value instanceof File) {
      return value
    }
  }

  return null
}

function assertPdfFile(file: File | null, label: string): asserts file is File {
  if (!file) {
    throw new Error(`${label} PDF is required`)
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

  if (!isPdf) {
    throw new Error(`${label} must be a PDF`)
  }

  if (file.size <= 0) {
    throw new Error(`${label} is empty`)
  }
}

function toWeightList(weights: Record<string, number>): Weight[] {
  return Object.entries(weights).map(([name, weight], index) => ({
    id: `weight-${index + 1}`,
    name,
    weight,
  }))
}

function toAssignments(assignments: ParsedAssignment[], prefix: string): Assignment[] {
  return assignments.map((assignment, index) => ({
    id: `${prefix}-${index + 1}`,
    ...assignment,
  }))
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const syllabusFile = getPdfFile(formData, ['syllabus', 'syllabusFile'])
    const gradesFile = getPdfFile(formData, ['grades', 'gradesFile'])

    assertPdfFile(syllabusFile, 'Syllabus')
    assertPdfFile(gradesFile, 'Grades export')

    const [syllabusText, gradesText] = await Promise.all([
      extractText(syllabusFile),
      extractText(gradesFile),
    ])

    const weights = normalizeWeights(await parseGrading(syllabusText))
    const grades = await parseGrades(gradesText, weights)
    const future = await parseFutureAssignments(grades, syllabusText, weights)
    const currentGrade = calculateGradeFromJson(grades, weights)
    const projectedGradeIfNoFutureDone = calculateGradeIfNoFutureDone(grades, future, weights)
    const neededScores = gradeEstimate(grades, future, weights)

    const payload: CourseAnalysisResponse = {
      weights,
      weightList: toWeightList(weights),
      grades,
      assignments: toAssignments(grades.Assignments, 'assignment'),
      future,
      futureAssignments: toAssignments(future.Assignments, 'future'),
      currentGrade,
      projectedGradeIfNoFutureDone,
      neededScores,
      neededScoreSummaries: summarizeNeededScores(neededScores),
    }

    return NextResponse.json(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to analyze course PDFs'
    const status =
      message.includes('required') || message.includes('must be a PDF') || message.includes('empty')
        ? 400
        : 500

    return NextResponse.json({ error: message }, { status })
  }
}
