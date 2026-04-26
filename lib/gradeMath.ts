import type {
  CourseOutlook,
  GradeEstimateKey,
  GradeEstimateResult,
  GradeEstimateScenario,
  GradeTarget,
  ImpactAssignmentSummary,
  NeededScoreAssignment,
  ParsedAssignment,
  ParsedAssignments,
  RecoveryPlanData,
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

function isReviewLikeLabel(label: string) {
  return /\b(review|practice|study guide|studyguide|prep|correction|corrections)\b/.test(label)
}

function isExtraCreditAssignment(assignment: ParsedAssignment) {
  if (assignment.extraCredit) {
    return true
  }

  const label = `${assignment.type} ${assignment.name}`.toLowerCase()

  return /\bextra credit\b/.test(label) || (
    isReviewLikeLabel(label) &&
    /\b(test|exam|final|midterm|quiz)\b/.test(label)
  )
}

function aggregateAssignments(assignments: ParsedAssignment[]): CategoryTotals {
  return assignments.reduce<CategoryTotals>((totals, assignment) => {
    const current = totals[assignment.type] ?? { points: 0, max: 0 }
    current.points += assignment.points
    current.max += isExtraCreditAssignment(assignment) ? 0 : assignment.max
    totals[assignment.type] = current
    return totals
  }, {})
}

function isVariableAssessment(assignment: ParsedAssignment) {
  const label = `${assignment.type} ${assignment.name}`.toLowerCase()

  if (isReviewLikeLabel(label) || isExtraCreditAssignment(assignment)) {
    return false
  }

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
      extraCredit: isExtraCreditAssignment(assignment),
    }
  })
}

function calculateGradeWithFutureScoreStrategy(
  grades: ParsedAssignments,
  future: ParsedAssignments,
  weights: WeightMap,
  getPointsForFutureAssignment: (assignment: ParsedAssignment, index: number) => number,
) {
  const combinedAssignments = [
    ...grades.Assignments,
    ...future.Assignments.map((assignment, index) => ({
      ...assignment,
      points: getPointsForFutureAssignment(assignment, index),
    })),
  ]

  return calculateGradeFromJson({ Assignments: combinedAssignments }, weights)
}

function solveUniformFutureRatio(
  grades: ParsedAssignments,
  future: ParsedAssignments,
  weights: WeightMap,
  target: number,
): number | null {
  const gradedTotals = aggregateAssignments(grades.Assignments)
  const futureTotals = aggregateAssignments(future.Assignments)

  let constant = 0
  let coefficient = 0

  for (const [category, weight] of Object.entries(weights)) {
    const graded = gradedTotals[category] ?? { points: 0, max: 0 }
    const futureCategory = futureTotals[category] ?? { points: 0, max: 0 }
    const totalMax = graded.max + futureCategory.max

    if (totalMax <= 0) {
      continue
    }

    constant += (graded.points / totalMax) * weight
    coefficient += (futureCategory.max / totalMax) * weight
  }

  if (coefficient <= 0) {
    return constant >= target ? 0 : null
  }

  return (target - constant) / coefficient
}

function getOutlookStatus(requiredAverage: number, targetFloor: number): CourseOutlook['status'] {
  if (requiredAverage <= 0) {
    return 'safe'
  }

  if (requiredAverage <= targetFloor) {
    return 'safe'
  }

  if (requiredAverage <= 90) {
    return 'possible'
  }

  if (requiredAverage <= 100) {
    return 'stretch'
  }

  return 'unlikely'
}

function getRecoveryConfidence(requiredAverage: number, targetFloor: number) {
  if (requiredAverage <= 0) {
    return 95
  }

  if (requiredAverage <= targetFloor) {
    return 86
  }

  if (requiredAverage <= 90) {
    return 74
  }

  if (requiredAverage <= 100) {
    return 52
  }

  return 18
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
        const standardAssignments = assignments.filter((assignment) => !assignment.extraCredit)
        const totalMax = standardAssignments.reduce((sum, assignment) => sum + assignment.max, 0)
        const totalPoints = standardAssignments.reduce((sum, assignment) => sum + assignment.pointsneeded, 0)

        return [
          scenario,
          totalMax > 0 ? roundTo((totalPoints / totalMax) * 100) : null,
        ]
      }),
    ) as Record<GradeEstimateScenario, number | null>

    return { target, scenarios }
  })
}

export function calculateRequiredAverageForTarget(
  grades: ParsedAssignments,
  future: ParsedAssignments,
  weights: WeightMap,
  targetGrade: GradeTarget,
) {
  const ratio = solveUniformFutureRatio(grades, future, weights, TARGETS[targetGrade])

  if (ratio === null) {
    return null
  }

  return roundTo(Math.max(ratio * 100, 0))
}

export function calculateImpactRanking(
  grades: ParsedAssignments,
  future: ParsedAssignments,
  weights: WeightMap,
): ImpactAssignmentSummary[] {
  if (future.Assignments.length === 0) {
    return []
  }

  const zeroFutureGrade = calculateGradeIfNoFutureDone(grades, future, weights)

  const rankedAssignments = future.Assignments
    .map((assignment, index) => {
      const gradeWithThisAssignmentPerfect = calculateGradeWithFutureScoreStrategy(
        grades,
        future,
        weights,
        (_, assignmentIndex) => (assignmentIndex === index ? assignment.max : 0),
      )

      return {
        id: `impact-${index + 1}`,
        name: assignment.name,
        category: assignment.type,
        gradeChange: roundTo(Math.max(gradeWithThisAssignmentPerfect - zeroFutureGrade, 0)),
        extraCredit: isExtraCreditAssignment(assignment),
      }
    })
    .sort((left, right) => right.gradeChange - left.gradeChange)

  const highestLift = rankedAssignments[0]?.gradeChange ?? 0

  return rankedAssignments.map((assignment) => {
    const ratio = highestLift > 0 ? assignment.gradeChange / highestLift : 0
    const impact =
      ratio >= 0.67 ? 'high' :
      ratio >= 0.34 ? 'medium' :
      'low'

    return {
      ...assignment,
      impact,
    }
  })
}

export function buildCourseOutlook(
  grades: ParsedAssignments,
  future: ParsedAssignments,
  weights: WeightMap,
  targetGrade: GradeTarget,
): CourseOutlook {
  const currentGrade = calculateGradeFromJson(grades, weights)
  const requiredAverage = calculateRequiredAverageForTarget(grades, future, weights, targetGrade)
  const topImpact = calculateImpactRanking(grades, future, weights)[0]
  const targetFloor = TARGETS[targetGrade]
  const focusArea = topImpact?.name ?? 'Current weighted average'

  if (future.Assignments.length === 0) {
    return currentGrade >= targetFloor ? {
      message: `No future assignments were inferred, and the current average already meets the ${targetGrade} target.`,
      targetGrade,
      status: 'safe',
      requiredAverage: 0,
      focusArea,
    } : {
      message: `No future assignments were inferred, so the current average stays below the ${targetGrade} target unless the course data changes.`,
      targetGrade,
      status: 'unlikely',
      requiredAverage: 101,
      focusArea,
    }
  }

  if (requiredAverage === null) {
    return {
      message: `${targetGrade} is not reachable from the inferred remaining work without changing the underlying course assumptions.`,
      targetGrade,
      status: 'unlikely',
      requiredAverage: 101,
      focusArea,
    }
  }

  const status = getOutlookStatus(requiredAverage, targetFloor)

  const message =
    status === 'safe'
      ? `${targetGrade} stays open if the remaining work averages about ${requiredAverage}% or better.`
      : status === 'possible'
        ? `${targetGrade} is still realistic if the remaining work stays near ${requiredAverage}% on average.`
        : status === 'stretch'
          ? `${targetGrade} is still possible, but the remaining work needs roughly ${requiredAverage}% on average.`
          : `${targetGrade} would require about ${requiredAverage}% on the inferred remaining work, which is beyond a normal grading scale.`

  return {
    message,
    targetGrade,
    status,
    requiredAverage,
    focusArea,
  }
}

export function buildRecoveryPlan(
  grades: ParsedAssignments,
  future: ParsedAssignments,
  weights: WeightMap,
  targetGrade: GradeTarget,
): RecoveryPlanData {
  const outlook = buildCourseOutlook(grades, future, weights, targetGrade)
  const impactAssignments = calculateImpactRanking(grades, future, weights)
  const projectedZero = calculateGradeIfNoFutureDone(grades, future, weights)
  const topImpact = impactAssignments[0]
  const secondImpact = impactAssignments[1]

  const steps = [
    topImpact ? {
      step: 1,
      action: `Prioritize ${topImpact.name}`,
      detail: `${topImpact.extraCredit ? 'It is a bonus opportunity tied to' : 'It is one of the largest remaining levers in'} ${topImpact.category} and can shift the course average by about +${topImpact.gradeChange} points from the zero-future baseline.`,
    } : {
      step: 1,
      action: 'Confirm the remaining assignment list',
      detail: 'No future assignments were inferred, so check the syllabus and uploads before planning the next move.',
    },
    outlook.status === 'unlikely' ? {
      step: 2,
      action: `Re-check the ${targetGrade} target assumptions`,
      detail: `The inferred remaining work would require about ${outlook.requiredAverage}% on average, so verify the uploads for missing assignments, drops, or extra credit.`,
    } : {
      step: 2,
      action: `Hold roughly ${outlook.requiredAverage}% on the remaining work`,
      detail: `That keeps the ${targetGrade} path aligned with the uploaded syllabus and grade export instead of drifting toward the ${projectedZero}% zero-future floor.`,
    },
    secondImpact ? {
      step: 3,
      action: `Protect ${secondImpact.name} next`,
      detail: `After the top priority, ${secondImpact.name} is the next strongest remaining lever in ${secondImpact.category}.`,
    } : {
      step: 3,
      action: 'Protect every available point',
      detail: `With limited future work inferred, avoid small losses because the zero-future floor sits around ${projectedZero}%.`,
    },
  ]

  return {
    steps,
    targetGrade,
    confidence: getRecoveryConfidence(outlook.requiredAverage, TARGETS[targetGrade]),
  }
}
