"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { FileText, Plus, Trash2, Upload, X } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface GradeCategory {
  id: string
  name: string
  weight: number
}

interface SyllabusInputProps {
  categories: GradeCategory[]
  onCategoriesChange: (categories: GradeCategory[]) => void
}

export interface ExtractedWeights {
  categories: GradeCategory[]
  confidence: number
  rawText: string
}

export function SyllabusInput({ categories, onCategoriesChange }: SyllabusInputProps) {
  const [syllabusText, setSyllabusText] = useState("")
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null)
  const [gradesFile, setGradesFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const syllabusInputRef = useRef<HTMLInputElement>(null)
  const gradesInputRef = useRef<HTMLInputElement>(null)

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ]

  const isValidFile = (file: File) => {
    return (
      allowedTypes.includes(file.type) ||
      file.name.endsWith(".pdf") ||
      file.name.endsWith(".docx") ||
      file.name.endsWith(".txt")
    )
  }

  const handleSyllabusFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && isValidFile(file)) {
      setSyllabusFile(file)
      setSyllabusText("")
    }
  }

  const handleGradesFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && isValidFile(file)) {
      setGradesFile(file)
    }
  }

  const removeSyllabusFile = () => {
    setSyllabusFile(null)
    if (syllabusInputRef.current) {
      syllabusInputRef.current.value = ""
    }
  }

  const removeGradesFile = () => {
    setGradesFile(null)
    if (gradesInputRef.current) {
      gradesInputRef.current.value = ""
    }
  }

  const handleExtract = async () => {
    if (!syllabusText.trim() && !syllabusFile && !gradesFile) return

    setIsExtracting(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))

    const mockExtracted: GradeCategory[] = [
      { id: "1", name: "Exams", weight: 40 },
      { id: "2", name: "Homework", weight: 20 },
      { id: "3", name: "Quizzes", weight: 20 },
      { id: "4", name: "Final", weight: 20 },
    ]
    onCategoriesChange(mockExtracted)
    setIsExtracting(false)
  }

  const updateCategory = (id: string, field: "name" | "weight", value: string | number) => {
    onCategoriesChange(
      categories.map((cat) =>
        cat.id === id ? { ...cat, [field]: field === "weight" ? Number(value) : value } : cat
      )
    )
  }

  const removeCategory = (id: string) => {
    onCategoriesChange(categories.filter((cat) => cat.id !== id))
  }

  const addCategory = () => {
    onCategoriesChange([...categories, { id: String(Date.now()), name: "Category", weight: 0 }])
  }

  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0)

  return (
    <Card className="h-full">
      <CardHeader className="gap-3 pb-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Course Setup</CardTitle>
          <CardDescription className="max-w-xl text-sm leading-6">
            Upload a syllabus or paste the grading policy, then confirm the category weights
            before running the outlook tools.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <input
          ref={syllabusInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleSyllabusFileSelect}
          className="hidden"
          aria-label="Upload syllabus file"
        />
        <input
          ref={gradesInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleGradesFileSelect}
          className="hidden"
          aria-label="Upload grades file"
        />

        <div className="rounded-2xl border border-dashed border-border/90 bg-muted/35 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Import course materials</p>
              <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                Add a syllabus, grade export, or pasted policy text. GradeGuard extracts the
                weighting structure so you can verify it before analysis.
              </p>
            </div>
            <Button
              onClick={handleExtract}
              disabled={isExtracting || (!syllabusText.trim() && !syllabusFile && !gradesFile)}
              className="w-full rounded-full px-5 sm:w-auto"
            >
              {isExtracting ? (
                <>
                  <Spinner className="h-3.5 w-3.5" />
                  Extracting...
                </>
              ) : (
                "Extract category weights"
              )}
            </Button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {syllabusFile ? (
              <div className="flex min-h-12 items-center justify-between rounded-xl border border-border/80 bg-card px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Syllabus attached</p>
                    <p className="truncate text-sm text-muted-foreground">{syllabusFile.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full text-muted-foreground hover:text-destructive"
                  onClick={removeSyllabusFile}
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Remove syllabus</span>
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => syllabusInputRef.current?.click()}
                className="flex min-h-12 items-center justify-between rounded-xl border border-dashed border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Upload syllabus</p>
                    <p className="text-sm text-muted-foreground">PDF, DOCX, or TXT</p>
                  </div>
                </div>
              </button>
            )}

            {gradesFile ? (
              <div className="flex min-h-12 items-center justify-between rounded-xl border border-border/80 bg-card px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Grades attached</p>
                    <p className="truncate text-sm text-muted-foreground">{gradesFile.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full text-muted-foreground hover:text-destructive"
                  onClick={removeGradesFile}
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Remove grades</span>
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => gradesInputRef.current?.click()}
                className="flex min-h-12 items-center justify-between rounded-xl border border-dashed border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Upload grade export</p>
                    <p className="text-sm text-muted-foreground">Optional supporting file</p>
                  </div>
                </div>
              </button>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="syllabus-text">
              Paste grading policy
            </label>
            <Textarea
              id="syllabus-text"
              placeholder="Paste the syllabus section that describes category weights, dropped assignments, or final exam rules."
              className="min-h-[128px] resize-none rounded-xl border-border/80 bg-card px-4 py-3 text-sm leading-6"
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
            />
          </div>
        </div>

        {categories.length === 0 && !isExtracting ? (
          <div className="rounded-2xl border border-dashed border-border/90 bg-muted/25 px-5 py-8 text-center">
            <p className="text-sm font-medium text-foreground">No grade categories configured</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Extract weights from the course materials or start with a manual category list.
            </p>
            <Button variant="outline" onClick={addCategory} className="mt-4 rounded-full px-5">
              <Plus className="h-4 w-4" />
              Add category manually
            </Button>
          </div>
        ) : categories.length > 0 ? (
          <div className="space-y-4 rounded-2xl border border-border/80 bg-card/80 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Grade categories</p>
                <p className="text-sm text-muted-foreground">
                  Confirm the names and weights before running the outlook.
                </p>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Total weight</span>{" "}
                <span
                  className={
                    totalWeight === 100
                      ? "font-semibold text-green-700"
                      : "font-semibold text-amber-700"
                  }
                >
                  {totalWeight}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_88px_44px] items-center gap-2 px-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              <span>Category</span>
              <span className="text-center">Weight</span>
              <span className="sr-only">Remove</span>
            </div>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="grid grid-cols-[minmax(0,1fr)_88px_44px] items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-3"
                >
                  <Input
                    value={cat.name}
                    onChange={(e) => updateCategory(cat.id, "name", e.target.value)}
                    className="h-10 rounded-lg border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                  />
                  <Input
                    type="number"
                    value={cat.weight}
                    onChange={(e) => updateCategory(cat.id, "weight", e.target.value)}
                    className="h-10 rounded-lg border-border/80 bg-card text-center text-sm"
                    min={0}
                    max={100}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => removeCategory(cat.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addCategory} className="w-full rounded-xl">
              <Plus className="h-4 w-4" />
              Add category
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
