export interface Weight {
  id: string
  name: string
  weight: number
}

export interface Assignment {
  id: string
  name: string
  type: string
  points: number
  max: number
}

export interface ParsedAssignment {
  name: string
  type: string
  points: number
  max: number
}

export interface ParsedAssignments {
  Assignments: ParsedAssignment[]
}

export type WeightMap = Record<string, number>

export type GradeTarget = 'A' | 'B' | 'C'
export type GradeEstimateScenario = '100' | '50' | '0'
export type GradeEstimateKey = `${GradeTarget}/${GradeEstimateScenario}`

export interface NeededScoreAssignment {
  name: string
  type: string
  pointsneeded: number
  max: number
}

export type GradeEstimateResult = Record<GradeEstimateKey, NeededScoreAssignment[]>

export interface NeededScoreSummary {
  target: GradeTarget
  scenarios: Record<GradeEstimateScenario, number | null>
}

export interface CourseAnalysisResponse {
  weights: WeightMap
  weightList: Weight[]
  grades: ParsedAssignments
  assignments: Assignment[]
  future: ParsedAssignments
  futureAssignments: Assignment[]
  currentGrade: number
  projectedGradeIfNoFutureDone: number
  neededScores: GradeEstimateResult
  neededScoreSummaries: NeededScoreSummary[]
}
