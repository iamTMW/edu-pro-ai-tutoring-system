import csv
import hashlib
import json
from pathlib import Path
from google import genai
from google.genai import types
from constants import USERSFOLDER

from constants import AUTH_TABLE


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_user_if_valid(username: str, password: str) -> dict | None:
    hashed_pw = hash_password(password)
    with open(AUTH_TABLE, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["username"] == username and row["hashed_password"] == hashed_pw:
                return row

    return None


def write_json(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def load_json(path: Path) -> dict:
    with open(path, "r") as f:
        return json.load(f)


def append_csv(path: Path, row: list, header: list = None):
    import csv
    path.parent.mkdir(parents=True, exist_ok=True)
    write_header = not path.exists() and header is not None
    with open(path, "a", newline="") as f:
        writer = csv.writer(f)
        if write_header:
            writer.writerow(header)
        writer.writerow(row)


def generate_practice_problems(user_id: str, class_id: str, lesson_id: str, theme: str):
    progress_file = USERSFOLDER / user_id / "classes" / class_id / "progress.json"
    student_class_folder = USERSFOLDER / user_id / "classes" / class_id
    progress = load_json(progress_file)
    lesson = progress["lessons"][lesson_id]

    modified_lesson = {
        "id": lesson_id,
        "title": lesson.get("title", lesson_id),
        "content": lesson["content"],
        "completed": lesson["completed"],
        "unlocked": lesson["unlocked"],
        "questions": {}
    }

    base_questions = []
    for question_difficulty in lesson.get("questions", []).values():
        for question in question_difficulty:
            base_questions.append(question["content"])
    
    themed_questions = theme_questions(base_questions, theme)
    questions_dict = dict(zip(base_questions, themed_questions))
    print(questions_dict)

    for question_difficulty, questions in lesson.get("questions", []).items():
        for q in questions:
            modified_lesson["questions"].setdefault(question_difficulty, [])
            # only use the generated question if the generated solution matches the original one - otherwise just use the base question
            if questions_dict[q["content"]]["numeric_solution"] == q["solution"]: # check to make sure Gemini didn't mess up the question
                modified_lesson["questions"][question_difficulty].append({
                    "id": q["id"],
                    "content": questions_dict[q["content"]]["question"],
                    "solution": q["solution"],
                    "solution_feedback": questions_dict[q["content"]]["solution"],
                    "hints": [questions_dict[q["content"]]["hint1"], questions_dict[q["content"]]["hint2"]],
                    "correct": False,
                    "time_taken": None,
                })
            else:
                modified_lesson["questions"][question_difficulty].append({
                    "id": q["id"],
                    "content": q["content"],
                    "solution": q["solution"],
                    "solution_feedback": q.get("solution_feedback"),
                    "hints": q.get("hints", ["No hint provided"]),
                    "correct": False,
                    "time_taken": None,
                })

    progress["lessons"][lesson_id] = modified_lesson
    write_json(student_class_folder / "progress.json", progress)


def theme_questions(questions: list, theme: str):
    client = genai.Client(api_key="AIzaSyBNg9XeOn_tlgIkknPqYmOKrofSQW_1C-Q")
    prompt = "For each of the following math problems, generate a practice word problem, 2 hints, and a detailed step-by-step solution.\n"
    system_instruction = f"For each practice problem you generate, use the following theme: {theme}. " \
                    "Questions and hints should be understandable to grade-school age children. " \
                    "Responses must have exactly the following format: " \
                    "Question: <generated question>\nHint: <generated hint>\nHint: <generated hint>\nSolution: <generated step-by-step solution>\nNumeric Solution: <numeric value of solution>\n" \
                    "The second hint should be more detailed than the first. " \
                    "Don't include blank lines between the questions."
    for question in questions:
        prompt += question + "\n"

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        config=types.GenerateContentConfig(system_instruction=system_instruction),
        contents=prompt
    )

    response_lines = response.text.splitlines()
    response_lines = list(filter(None, response_lines)) # remove any blank lines that might have been generated

    while len(response_lines) != len(questions) * 5: # make sure that Gemini didn't generate the response in the wrong format
        print("Gemini response in wrong format - regenerating...")
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            config=types.GenerateContentConfig(system_instruction=system_instruction),
            contents=prompt
        )
        response_lines = response.text.splitlines()
        response_lines = list(filter(None, response_lines))

    themed_questions = []
    for line in range(0, len(questions) * 5, 5):
        themed_questions.append({"question": response_lines[line].split(":", maxsplit=1)[1].strip(),
                                 "hint1": response_lines[line + 1].split(":", maxsplit=1)[1].strip(),
                                 "hint2": response_lines[line + 2].split(":", maxsplit=1)[1].strip(),
                                 "solution": response_lines[line + 3].split(":", maxsplit=1)[1].strip(),
                                 "numeric_solution": response_lines[line + 4].split(":", maxsplit=1)[1].strip()})

    return themed_questions