import { z } from 'zod'

import { generateStructuredJson } from '@/lib/gemini'
import type { ParsedAssignments, WeightMap } from '@/types/grade'

const weightsSchema = z.record(z.string(), z.coerce.number().finite().nonnegative())

const parsedAssignmentsSchema = z.object({
  Assignments: z.array(
    z.object({
      name: z.string().trim().min(1),
      type: z.string().trim().min(1),
      points: z.coerce.number().finite().nonnegative(),
      max: z.coerce.number().finite().positive(),
      extraCredit: z.coerce.boolean().optional().default(false),
    }),
  ),
})

const weightsJsonSchema = {
  type: 'object',
  additionalProperties: {
    type: 'number',
  },
} as const

const parsedAssignmentsJsonSchema = {
  type: 'object',
  properties: {
    Assignments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          points: { type: 'number' },
          max: { type: 'number' },
          extraCredit: { type: 'boolean' },
        },
        required: ['name', 'type', 'points', 'max', 'extraCredit'],
        additionalProperties: false,
      },
    },
  },
  required: ['Assignments'],
  additionalProperties: false,
} as const

function formatCategories(categories: WeightMap) {
  return JSON.stringify(categories, null, 2)
}

function normalizeParsedAssignments(payload: unknown): ParsedAssignments {
  const parsed = parsedAssignmentsSchema.parse(payload)

  return {
    Assignments: parsed.Assignments.map((assignment) => ({
      name: assignment.name.trim(),
      type: assignment.type.trim(),
      points: assignment.points,
      max: assignment.max,
      extraCredit: assignment.extraCredit,
    })),
  }
}

// Original Streamlit function: parse_grading(text)
export async function parseGrading(text: string): Promise<WeightMap> {
  const prompt = `
Extract the grading breakdown from this syllabus.

Return ONLY valid JSON in this format:
{
  "Homework": 20,
  "Quizzes": 20,
  "Tests": 20,
  "Labs": 20,
  "Final": 20
}

Rules:
- Do NOT include explanations
- Do NOT include markdown
- If wording is unclear, infer the most reasonable stated category names
- If a category is missing, do not add it to the JSON
- Return the percentages as they appear in the syllabus; normalization will be handled separately
- If the category names are different, use the category names from the syllabus but still return valid JSON

Syllabus:
${text}
`

  const payload = await generateStructuredJson<unknown>(prompt, weightsJsonSchema)
  return weightsSchema.parse(payload)
}

// Original Streamlit function: parse_grades(text, categories)
export async function parseGrades(text: string, categories: WeightMap): Promise<ParsedAssignments> {
  const prompt = `
Extract the grades of each assignment from this PDF.

Return ONLY valid JSON in this format:
{
  "Assignments": [
    {
      "name": "Assignment 1",
      "type": "Homework",
      "points": 85,
      "max": 100,
      "extraCredit": false
    },
    {
      "name": "Assignment 2",
      "type": "Homework",
      "points": 90,
      "max": 100,
      "extraCredit": false
    }
  ]
}

Rules:
- Do NOT include explanations
- Do NOT include markdown
- If wording is unclear, infer the most reasonable points
- Match the type with the best corresponding category in the categories JSON
- The max of the assignment is the denominator for the score; if the PDF says "85/100", the max is 100 and the points is 85
- Set "extraCredit" to true for bonus work, test reviews, review sheets, correction work, or anything that should count as extra credit instead of a normal graded assessment
- If an item is a test review, keep "type" matched to the closest real category such as Tests or Exams, but set "extraCredit" to true
- Ignore everything past Attendance, so do not include Attendance and anything below it in the PDF

Grades:
${text}

Categories:
${formatCategories(categories)}
`

  const payload = await generateStructuredJson<unknown>(prompt, parsedAssignmentsJsonSchema)
  return normalizeParsedAssignments(payload)
}

// Original Streamlit function: parse_future(grades, syllabus_text, categories)
export async function parseFutureAssignments(
  grades: ParsedAssignments,
  syllabusText: string,
  categories: WeightMap,
): Promise<ParsedAssignments> {
  const prompt = `
Using the syllabus, grades, and categories, extrapolate the rest of the assignments in the course and their corresponding grades.

Return ONLY valid JSON in this format:
{
  "Assignments": [
    {
      "name": "Assignment 1",
      "type": "Homework",
      "points": 0,
      "max": 100,
      "extraCredit": false
    },
    {
      "name": "Assignment 2",
      "type": "Homework",
      "points": 0,
      "max": 100,
      "extraCredit": false
    }
  ]
}

Rules:
- Do NOT include explanations
- Do NOT include markdown
- If wording is unclear, infer the most reasonable future assignment names and max points
- Match the type with the best corresponding category in the categories JSON
- The max of the assignment is the denominator for the score, while the points should be 0 for future work
- Set "extraCredit" to true for bonus work, test reviews, review sheets, correction work, or anything that should count as extra credit instead of a normal graded assessment
- If an item is a test review, keep "type" matched to the closest real category such as Tests or Exams, but set "extraCredit" to true
- If the syllabus shows that there will be more assignments in the future, create reasonable entries for those assignments with points at 0
- Do not repeat assignments that already appear in the grades JSON

Grades:
${JSON.stringify(grades, null, 2)}

Syllabus:
${syllabusText}

Categories:
${formatCategories(categories)}
`

  const payload = await generateStructuredJson<unknown>(prompt, parsedAssignmentsJsonSchema)
  return normalizeParsedAssignments(payload)
}

export const parseFuture = parseFutureAssignments
