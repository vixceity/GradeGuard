"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Upload, FileText, X } from "lucide-react"
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
    "text/plain"
  ]

  const isValidFile = (file: File) => {
    return allowedTypes.includes(file.type) || 
      file.name.endsWith(".pdf") || 
      file.name.endsWith(".docx") || 
      file.name.endsWith(".txt")
  }

  const handleSyllabusFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && isValidFile(file)) {
      setSyllabusFile(file)
      setSyllabusText("")
    }
  }

  const handleGradesFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    // TODO: Replace with Gemini API call
    await new Promise(resolve => setTimeout(resolve, 1200))

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
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Course Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden file inputs */}
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

        {/* File upload section */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Upload Documents</p>
          <div className="grid grid-cols-2 gap-2">
            {/* Syllabus upload */}
            {syllabusFile ? (
              <div className="flex items-center justify-between p-2 bg-muted rounded border border-border">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs truncate">{syllabusFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={removeSyllabusFile}
                >
                  <X className="w-3 h-3" />
                  <span className="sr-only">Remove syllabus</span>
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => syllabusInputRef.current?.click()}
                className="p-3 border border-dashed border-border rounded text-center hover:border-primary hover:bg-muted/50 transition-colors"
              >
                <Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Syllabus</p>
              </button>
            )}

            {/* Grades upload */}
            {gradesFile ? (
              <div className="flex items-center justify-between p-2 bg-muted rounded border border-border">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs truncate">{gradesFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={removeGradesFile}
                >
                  <X className="w-3 h-3" />
                  <span className="sr-only">Remove grades</span>
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => gradesInputRef.current?.click()}
                className="p-3 border border-dashed border-border rounded text-center hover:border-primary hover:bg-muted/50 transition-colors"
              >
                <Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Grades</p>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 border-t border-border" />
          <span>or paste text</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <Textarea
          placeholder="Paste your syllabus grading policy..."
          className="min-h-[60px] resize-none text-sm"
          value={syllabusText}
          onChange={(e) => setSyllabusText(e.target.value)}
        />

        <Button 
          onClick={handleExtract} 
          disabled={isExtracting || (!syllabusText.trim() && !syllabusFile && !gradesFile)} 
          variant="secondary"
          size="sm"
          className="w-full"
        >
          {isExtracting ? (
            <>
              <Spinner className="w-3.5 h-3.5 mr-2" />
              Extracting...
            </>
          ) : (
            "Extract Weights"
          )}
        </Button>

        {/* Categories section */}
        {categories.length === 0 && !isExtracting ? (
          <div className="pt-4 border-t border-border">
            <div className="py-4 text-center border border-dashed border-border rounded">
              <p className="text-xs text-muted-foreground mb-2">No weights defined</p>
              <button onClick={addCategory} className="text-xs text-primary hover:underline">
                Add manually
              </button>
            </div>
          </div>
        ) : categories.length > 0 ? (
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-muted-foreground">Grade Categories</span>
              <span className={totalWeight === 100 ? "text-green-600" : "text-amber-600"}>
                Total: {totalWeight}%
              </span>
            </div>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <Input
                    value={cat.name}
                    onChange={(e) => updateCategory(cat.id, "name", e.target.value)}
                    className="flex-1 h-8 text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={cat.weight}
                      onChange={(e) => updateCategory(cat.id, "weight", e.target.value)}
                      className="w-14 h-8 text-sm text-center"
                      min={0}
                      max={100}
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeCategory(cat.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addCategory} className="w-full">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Category
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
