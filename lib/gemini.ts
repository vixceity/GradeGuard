import { GoogleGenAI } from '@google/genai'

const GEMINI_MODEL = 'gemini-2.5-flash'

let cachedClient: GoogleGenAI | null = null

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }

  return cachedClient
}

// Original Streamlit function: clean_json(text)
export function cleanJson(text: string): unknown {
  if (!text.trim()) {
    throw new Error('Empty response from Gemini')
  }

  const normalized = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  try {
    return JSON.parse(normalized)
  } catch {
    const firstObject = normalized.indexOf('{')
    const firstArray = normalized.indexOf('[')
    const start =
      firstObject === -1
        ? firstArray
        : firstArray === -1
          ? firstObject
          : Math.min(firstObject, firstArray)

    if (start === -1) {
      throw new Error('Gemini did not return JSON')
    }

    const objectEnd = normalized.lastIndexOf('}')
    const arrayEnd = normalized.lastIndexOf(']')
    const end = Math.max(objectEnd, arrayEnd)

    if (end === -1 || end <= start) {
      throw new Error('Gemini returned malformed JSON')
    }

    return JSON.parse(normalized.slice(start, end + 1))
  }
}

export async function generateStructuredJson<T>(prompt: string, schema: unknown): Promise<T> {
  const response = await getGeminiClient().models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
    },
  })

  if (!response.text) {
    throw new Error('Gemini returned no text content')
  }

  return cleanJson(response.text) as T
}
