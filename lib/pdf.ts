import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

type PdfSource = File | ArrayBuffer | Uint8Array | Buffer
type PDFTextResult = {
  text: string
}

type PDFParseInstance = {
  destroy(): Promise<void>
  getText(): Promise<PDFTextResult>
}

type PDFParseConstructor = {
  new (options: { data: Uint8Array }): PDFParseInstance
  setWorker(workerSrc: string): string
}

const require = createRequire(import.meta.url)

let pdfParseConstructor: PDFParseConstructor | null = null
let workerConfigured = false

function getPDFParse() {
  if (!pdfParseConstructor) {
    const pdfParseModule = require('pdf-parse') as { PDFParse?: PDFParseConstructor }

    if (!pdfParseModule.PDFParse) {
      throw new Error('pdf-parse did not export PDFParse')
    }

    pdfParseConstructor = pdfParseModule.PDFParse
  }

  return pdfParseConstructor
}

function ensurePdfWorkerConfigured() {
  if (workerConfigured) {
    return
  }

  const workerFile = join(
    process.cwd(),
    'node_modules',
    'pdfjs-dist',
    'legacy',
    'build',
    'pdf.worker.mjs',
  )

  if (!existsSync(workerFile)) {
    throw new Error(`pdf.js worker not found at ${workerFile}`)
  }

  getPDFParse().setWorker(pathToFileURL(workerFile).href)
  workerConfigured = true
}

function isFileLike(source: PdfSource): source is File {
  return typeof File !== 'undefined' && source instanceof File
}

async function toPdfBytes(source: PdfSource): Promise<Uint8Array> {
  if (source instanceof Uint8Array) {
    return source
  }

  if (source instanceof ArrayBuffer) {
    return new Uint8Array(source)
  }

  if (isFileLike(source)) {
    return new Uint8Array(await source.arrayBuffer())
  }

  throw new Error('Unsupported PDF source')
}

// Original Streamlit function: extract_text(file)
export async function extractText(source: PdfSource): Promise<string> {
  ensurePdfWorkerConfigured()
  const PDFParse = getPDFParse()
  const parser = new PDFParse({ data: await toPdfBytes(source) })

  try {
    const result = await parser.getText()
    return result.text.trim()
  } finally {
    await parser.destroy()
  }
}
