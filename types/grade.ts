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
  extraCredit?: boolean
}

export interface ParsedAssignment {
  name: string
  type: string
  points: number
  max: number
  extraCredit?: boolean
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
  extraCredit?: boolean
}

export type GradeEstimateResult = Record<GradeEstimateKey, NeededScoreAssignment[]>

export interface NeededScoreSummary {
  target: GradeTarget
  scenarios: Record<GradeEstimateScenario, number | null>
}

export type OutlookStatus = 'safe' | 'possible' | 'stretch' | 'unlikely'

export interface CourseOutlook {
  message: string
  targetGrade: GradeTarget
  status: OutlookStatus
  requiredAverage: number
  focusArea: string
}

export type ImpactLevel = 'high' | 'medium' | 'low'

export interface ImpactAssignmentSummary {
  id: string
  name: string
  impact: ImpactLevel
  gradeChange: number
  category: string
  extraCredit?: boolean
}

export interface RecoveryStep {
  step: number
  action: string
  detail: string
}

export interface RecoveryPlanData {
  steps: RecoveryStep[]
  targetGrade: GradeTarget
  confidence: number
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
