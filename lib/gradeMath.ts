import type {
  GradeEstimateKey,
  GradeEstimateResult,
  GradeEstimateScenario,
  GradeTarget,
  NeededScoreAssignment,
  ParsedAssignment,
  ParsedAssignments,
  WeightMap,
} from '@/types/grade'

type CategoryTotals = Record<string, { points: number; max: number }>

const TARGETS: Record<GradeTarget, number> = {
  A: 90,
  B: 80,
  C: 70,
}

const SCENARIOS: GradeEstimateScenario[] = ['100', '50', '0']

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function normalizeWeights(weights: WeightMap): WeightMap {
  const cleaned = Object.fromEntries(
    Object.entries(weights)
      .map(([name, weight]) => [name.trim(), Number(weight)] as const)
      .filter(([name, weight]) => name.length > 0 && Number.isFinite(weight) && weight >= 0),
  )

  const total = Object.values(cleaned).reduce((sum, weight) => sum + weight, 0)

  if (total <= 0) {
    return cleaned
  }

  if (Math.abs(total - 100) < 0.001) {
    return cleaned
  }

  return Object.fromEntries(
    Object.entries(cleaned).map(([name, weight]) => [name, roundTo((weight / total) * 100)]),
  )
}

function aggregateAssignments(assignments: ParsedAssignment[]): CategoryTotals {
  return assignments.reduce<CategoryTotals>((totals, assignment) => {
    const current = totals[assignment.type] ?? { points: 0, max: 0 }
    current.points += assignment.points
    current.max += assignment.max
    totals[assignment.type] = current
    return totals
  }, {})
}

function isVariableAssessment(assignment: ParsedAssignment) {
  const label = `${assignment.type} ${assignment.name}`.toLowerCase()
  return /\b(test|exam|final|midterm)\b/.test(label)
}

function scenarioRatio(scenario: GradeEstimateScenario) {
  if (scenario === '100') {
    return 1
  }

  if (scenario === '50') {
    return 0.5
  }

  return 0
}

// Original Streamlit function: calculate_grade_from_json(grades_json, weights_json)
export function calculateGradeFromJson(gradesJson: ParsedAssignments, weightsJson: WeightMap): number {
  const categoryScores = aggregateAssignments(gradesJson.Assignments)

  let totalScore = 0

  for (const [category, score] of Object.entries(categoryScores)) {
    const weight = weightsJson[category]

    if (weight === undefined || score.max <= 0) {
      continue
    }

    totalScore += (score.points / score.max) * (weight / 100)
  }

  return roundTo(totalScore * 100)
}

// Original Streamlit function: calculate_grade_if_no_future_done(grades, future, weights)
export function calculateGradeIfNoFutureDone(
  grades: ParsedAssignments,
  future: ParsedAssignments,
  weights: WeightMap,
): number {
  const combinedAssignments = [
    ...grades.Assignments,
    ...future.Assignments.map((assignment) => ({
      ...assignment,
      points: 0,
    })),
  ]

  return calculateGradeFromJson({ Assignments: combinedAssignments }, weights)
}

function solveVariableRatio(
  grades: ParsedAssignments,
  future: ParsedAssignments,
  weights: WeightMap,
  target: number,
  fixedRatio: number,
): number | null {
  const gradedTotals = aggregateAssignments(grades.Assignments)
  const futureTotals = aggregateAssignments(future.Assignments)

  const variableAssignments = future.Assignments.filter(isVariableAssessment)
  const effectiveVariableAssignments =
    variableAssignments.length > 0 ? variableAssignments : future.Assignments

  const fixedAssignments = future.Assignments.filter(
    (assignment) => !effectiveVariableAssignments.includes(assignment),
  )

  const variableTotals = aggregateAssignments(effectiveVariableAssignments)
  const fixedTotals = aggregateAssignments(
    fixedAssignments.map((assignment) => ({
      ...assignment,
      points: assignment.max * fixedRatio,
    })),
  )

  let constant = 0
  let coefficient = 0

  for (const [category, weight] of Object.entries(weights)) {
    const graded = gradedTotals[category] ?? { points: 0, max: 0 }
    const futureCategory = futureTotals[category] ?? { points: 0, max: 0 }
    const variable = variableTotals[category] ?? { points: 0, max: 0 }
    const fixed = fixedTotals[category] ?? { points: 0, max: 0 }

    const totalMax = graded.max + futureCategory.max

    if (totalMax <= 0) {
      continue
    }

    constant += ((graded.points + fixed.points) / totalMax) * weight
    coefficient += (variable.max / totalMax) * weight
  }

  if (coefficient <= 0) {
    return constant >= target ? 0 : null
  }

  return (target - constant) / coefficient
}

function buildScenarioAssignments(
  futureAssignments: ParsedAssignment[],
  scenario: GradeEstimateScenario,
  variableRatio: number | null,
): NeededScoreAssignment[] {
  const variableAssignments = futureAssignments.filter(isVariableAssessment)
  const effectiveVariableAssignments =
    variableAssignments.length > 0 ? variableAssignments : futureAssignments
  const fixedRatio = scenarioRatio(scenario)

  return futureAssignments.map((assignment) => {
    const isVariable = effectiveVariableAssignments.includes(assignment)
    const pointsneeded = isVariable
      ? variableRatio === null
        ? 0
        : assignment.max * variableRatio
      : assignment.max * fixedRatio

    return {
      name: assignment.name,
      type: assignment.type,
      pointsneeded: roundTo(Math.max(pointsneeded, 0)),
      max: assignment.max,
    }
  })
}

// Original Streamlit function: grade_estimate(grades, future, weights)
export function gradeEstimate(
  grades: ParsedAssignments,
  future: ParsedAssignments,
  weights: WeightMap,
): GradeEstimateResult {
  const result = {} as GradeEstimateResult

  ;(['A', 'B', 'C'] as GradeTarget[]).forEach((target) => {
    SCENARIOS.forEach((scenario) => {
      const key = `${target}/${scenario}` as GradeEstimateKey
      const ratio = solveVariableRatio(
        grades,
        future,
        weights,
        TARGETS[target],
        scenarioRatio(scenario),
      )

      result[key] = buildScenarioAssignments(future.Assignments, scenario, ratio)
    })
  })

  return result
}

export function summarizeNeededScores(neededScores: GradeEstimateResult) {
  return (['A', 'B', 'C'] as GradeTarget[]).map((target) => {
    const scenarios = Object.fromEntries(
      SCENARIOS.map((scenario) => {
        const assignments = neededScores[`${target}/${scenario}` as GradeEstimateKey]
        const totalMax = assignments.reduce((sum, assignment) => sum + assignment.max, 0)
        const totalPoints = assignments.reduce((sum, assignment) => sum + assignment.pointsneeded, 0)

        return [
          scenario,
          totalMax > 0 ? roundTo((totalPoints / totalMax) * 100) : null,
        ]
      }),
    ) as Record<GradeEstimateScenario, number | null>

    return { target, scenarios }
  })
}
