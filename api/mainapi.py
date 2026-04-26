import os
import re
import json
from io import BytesIO
from typing import Dict, Optional

from dotenv import load_dotenv
import pdfplumber
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from google import genai

load_dotenv()
api_key = os.getenv("GENAI_API_KEY")
if not api_key:
    raise RuntimeError("GENAI_API_KEY environment variable is required")

client = genai.Client(api_key=api_key)
modelgemini = "models/gemini-2.5-flash"

app = FastAPI(title="Grade API")


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def clean_json(text: str) -> Dict:
    if not text:
        raise ValueError("Empty response from Gemini")

    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text)
    match = re.search(r"\{.*\}", text, re.S)
    if match:
        text = match.group(0)
    return json.loads(text.strip())


def parse_grading(text: str) -> Dict:
    prompt = f"""
Extract the grading breakdown from this syllabus.

Return ONLY valid JSON in this format:
{{
  "Homework": 20,
  "Quizzes": 20,
  "Tests": 20,
  "Labs": 20,
  "Final": 20
}}

Rules:
- Do NOT include explanations
- Do NOT include markdown
- If wording is unclear, infer best reasonable weights
- If a category is missing, do not add it to the JSON
- Total weights should sum to 100%, but if they don't, estimate relative weights and normalize to 100%
- If the category names are different, use the category names from the syllabus but still return valid JSON

Syllabus:
{text}
"""

    response = client.models.generate_content(
        model=modelgemini,
        contents=prompt,
    )
    return clean_json(response.text)


def parse_grades(text: str, categories: Dict) -> Dict:
    prompt = f"""
Extract the grades of each assignment from this PDF.
Return ONLY valid JSON in this format:
{{
  "Assignments": [
    {{
      "name": "Assignment 1",
      "type": "Homework",
      "points": 85,
      "max": 100
    }},
    {{
      "name": "Assignment 2",
      "type": "Homework",
      "points": 90,
      "max": 100
    }}
  ]
}}

Rules:
- Do NOT include explanations
- Do NOT include markdown
- If wording is unclear, infer best reasonable points
- Match the type with the best corresponding category in the categories JSON
- The max of the assignment is the denominator for the score, if the PDF says "85/100", the max is 100 and the points is 85
- Ignore everything past Attendance, so don't include Attendance and anything below it in the PDF

Grades:
{text}

Categories:
{categories}
"""

    response = client.models.generate_content(
        model=modelgemini,
        contents=prompt,
    )
    return clean_json(response.text)


def parse_future(grades: Dict, syllabus_text: str, categories: Dict) -> Dict:
    prompt = f"""
Using the syllabus, grades, and categories, extrapolate the rest of the assignments in the course and their corresponding grades.
Return ONLY valid JSON in this format:
{{
  "Assignments": [
    {{
      "name": "Assignment 1",
      "type": "Homework",
      "points": 85,
      "max": 100
    }},
    {{
      "name": "Assignment 2",
      "type": "Homework",
      "points": 90,
      "max": 100
    }}
  ]
}}

Rules:
- Do NOT include explanations
- Do NOT include markdown
- If wording is unclear, infer best reasonable points
- Match the type with the best corresponding category in the categories JSON
- The max of the assignment is the denominator for the score, while the points is the numerator
- If the syllabus shows that there will be more assignments in the future, create reasonable fake entries for those assignments with points at 0

Grade:
{grades}

Syllabus:
{syllabus_text}

Categories:
{categories}
"""

    response = client.models.generate_content(
        model=modelgemini,
        contents=prompt,
    )
    return clean_json(response.text)


def calculate_grade_from_json(grades_json: Dict, weights_json: Dict) -> float:
    category_scores = {}
    for assignment in grades_json["Assignments"]:
        category = assignment["type"]
        if category not in category_scores:
            category_scores[category] = {"points": 0, "max": 0}
        category_scores[category]["points"] += assignment["points"]
        category_scores[category]["max"] += assignment["max"]

    total_score = 0
    for category, score in category_scores.items():
        if category in weights_json and score["max"] > 0:
            weight = weights_json[category] / 100
            category_percentage = score["points"] / score["max"]
            total_score += category_percentage * weight
    return total_score * 100


def calculate_grade_if_no_future_done(grades: Dict, future: Dict, weights: Dict) -> float:
    combined_assignments = grades["Assignments"] + [
        {**assignment, "points": 0} for assignment in future["Assignments"]
    ]
    combined_grades = {"Assignments": combined_assignments}
    return calculate_grade_from_json(combined_grades, weights)


def grade_estimate(grades: Dict, future: Dict, weights: Dict) -> Dict:
    prompt = f"""
Create a valid JSON response showing the scores needed on each future assignment to achieve an A (90%), B (80%), or C (70%) in the class.
Return only valid JSON, no markdown, no code fences, no prose.

The JSON should contain these six keys: A/100, A/50, A/0,B/100, B/50, B/0, C/100, C/50, C/0.
Each key should be an array of assignment objects with:
- name
- type
- pointsneeded
- max

100 represents that the student got a 100% (maximum points) on all non test/final assignments, so like quizzes and homework, while 50 represents that the student got 50% on all non test/final assignments.
0 represents that the student got 0% on all non test/final assignments.

If there is only the test/final left, then the 100/50/0 do not matter since the grade is entirely dependent on the test/final, so in that case just return the points needed on the test/final to achieve an A/B/C.

Example format:
{{
  "A/100": [
    {{"name": "Homework 1", "type": "Homework", "pointsneeded": 100, "max": 100}}
  ],
  "A/50": [...],
  "A/0": [...],
  "B/100": [...],
  "B/50": [...],
  "B/0": [...],
  "C/100": [...],
  "C/50": [...]
  "C/0": [...]
}}

Use the provided grades, future assignments, and weights to calculate the needed scores.

Grades:
{grades}

Future Assignments:
{future}

Weights:
{weights}
"""
    response = client.models.generate_content(
        model=modelgemini,
        contents=prompt,
    )
    return clean_json(response.text)


@app.get("/")
def read_root():
    return {"message": "Grade API is running. Use /parse-syllabus, /parse-grades, /parse-future, /calculate-grade, /grade-estimate."}


@app.post("/parse-syllabus")
async def api_parse_syllabus(file: UploadFile = File(...)):
    content = await file.read()
    text = extract_text_from_pdf(content)
    try:
        weights = parse_grading(text)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return JSONResponse(content=weights)


@app.post("/parse-grades")
async def api_parse_grades(
    file: UploadFile = File(...),
    categories: str = Form(...),
):
    try:
        categories_json = json.loads(categories)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid categories JSON: {exc}")

    content = await file.read()
    text = extract_text_from_pdf(content)
    try:
        grades = parse_grades(text, categories_json)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return JSONResponse(content=grades)

    
@app.post("/parse-future")
async def api_parse_future(
    grades: str = Form(...),
    categories: str = Form(...),
    syllabus_file: UploadFile = File(...),
):
    try:
        grades_json = json.loads(grades)
        categories_json = json.loads(categories)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid JSON for grades or categories: {exc}")

    if syllabus_file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="syllabus_file must be a PDF")

    content = await syllabus_file.read()
    syllabus_text = extract_text_from_pdf(content)
    try:
        future = parse_future(grades_json, syllabus_text, categories_json)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return JSONResponse(content=future)


@app.post("/calculate-grade")
def api_calculate_grade(
    grades: str = Form(...),
    weights: str = Form(...),
):
    try:
        grades_json = json.loads(grades)
        weights_json = json.loads(weights)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid JSON for grades or weights: {exc}")

    try:
        score = calculate_grade_from_json(grades_json, weights_json)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"grade": score}


@app.post("/calculate-grade-no-future")
def api_calculate_grade_no_future(
    grades: str = Form(...),
    future: str = Form(...),
    weights: str = Form(...),
):
    try:
        grades_json = json.loads(grades)
        future_json = json.loads(future)
        weights_json = json.loads(weights)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid JSON for grades, future, or weights: {exc}")

    try:
        score = calculate_grade_if_no_future_done(grades_json, future_json, weights_json)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"grade": score}


@app.post("/grade-estimate")
def api_grade_estimate(
    grades: str = Form(...),
    future: str = Form(...),
    weights: str = Form(...),
):
    try:
        grades_json = json.loads(grades)
        future_json = json.loads(future)
        weights_json = json.loads(weights)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid JSON for grades, future, or weights: {exc}")

    try:
        estimate = grade_estimate(grades_json, future_json, weights_json)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return JSONResponse(content=estimate)
