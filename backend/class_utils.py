from constants import QUESTION_GENERATORS

# Where we will store the default math template JSON
DEFAULT_MATH_TEMPLATE = QUESTION_GENERATORS / "default_math_template.json"

import uuid
import random
from copy import deepcopy
from datetime import datetime
from shutil import copy2

from constants import USERSFOLDER, CLASSES_CSV, CLASSES_FOLDER, HTML_CONTENT_SRC
from helpers import append_csv, write_json, load_json, generate_practice_problems
from ml_algo_mmr import assign_mmr_for_lesson


# def normalize_template(template_json):
#     """
#     each question dict to have keys: id, level, content, hints, solution
#     """
#     normalized = {"modules": {}}
#     lesson_counter = 1
#
#     for lesson_key, questions in template_json.items():
#         module_id = f"module_{lesson_counter:03d}"
#         content_filename = f"{lesson_key}.html"
#
#         normalized_questions = []
#         for q_idx, q in enumerate(questions, start=1):
#             normalized_questions.append({
#                 "id": q.get("id", f"{lesson_key}_{q['level']}_{q_idx}"),
#                 "q": q["content"],
#                 "a": q["solution"],
#                 "hint": q.get("hints", ["No hint provided"]),  # always a list
#                 "level": q["level"]  # string
#             })
#
#         normalized["modules"][module_id] = {
#             "id": module_id,
#             "name": f"Module {lesson_counter}",
#             "content_path": f"content/{content_filename}",
#             "completed": False,
#             "unlocked": lesson_counter == 1,
#             "lessons": {
#                 lesson_key: {
#                     "id": lesson_key,
#                     "content": content_filename,
#                     "questions": normalized_questions
#                 }
#             }
#         }
#         lesson_counter += 1
#
#     return normalized

# def normalize_template(template_json):
#     """
#     Convert teacher-uploaded template into a minimal class template.
#     Stores:
#         - id
#         - content
#         - solution (expected answer)
#         - solution_feedback (optional explanation, null if missing)
#         - hints
#         - level
#     """
#     normalized = {"modules": {}}
#     lesson_counter = 1
#
#     for lesson_key, questions in template_json.items():
#         module_id = f"module_{lesson_counter:03d}"
#         content_filename = f"{lesson_key}.html"
#
#         normalized_questions = []
#         for q_idx, q in enumerate(questions, start=1):
#             normalized_questions.append({
#                 "id": q.get("id", f"{lesson_key}_{q['level']}_{q_idx}"),
#                 "content": q["content"],
#                 "solution": q["solution"],  # expected answer
#                 "solution_feedback": q.get("solution_feedback"),  # null if missing
#                 "hints": q.get("hints", ["No hint provided"]),
#                 "level": q["level"]
#             })
#
#         normalized["modules"][module_id] = {
#             "id": module_id,
#             "name": f"Module {lesson_counter}",
#             "content_path": f"content/{content_filename}",
#             "lessons": {
#                 lesson_key: {
#                     "id": lesson_key,
#                     "content": content_filename,
#                     "questions": normalized_questions
#                 }
#             }
#         }
#         lesson_counter += 1
#
#     return normalized

def normalize_template(template_json):
    normalized = {}
    for lesson_key, questions in template_json.items():
        normalized_questions = []
        for q_idx, q in enumerate(questions, start=1):
            normalized_questions.append({
                "id": q.get("id", f"{lesson_key}_{q['level']}_{q_idx}"),
                "content": q["content"],
                "solution": q["solution"],
                "solution_feedback": q.get("solution_feedback"),
                "hints": q.get("hints", ["No hint provided"]),
                "level": q["level"]
            })

        normalized[lesson_key] = {
            "id": lesson_key,
            "title": q.get("title", f"Lesson {lesson_key}"),
            "content": f"content/{lesson_key}.html",
            "completed": False,
            "unlocked": False,
            "questions": normalized_questions
        }

    # Unlock the first lesson by default
    first_lesson = next(iter(normalized))
    normalized[first_lesson]["unlocked"] = True
    return normalized


# def create_questions_for_student(userid: str, class_id: str):
#     """
#     Generate progress.json for a student, including:
#         - correct / time_taken / rating (MMR)
#         - first module unlocked
#     """
#     class_folder = CLASSES_FOLDER / class_id
#     student_class_folder = USERSFOLDER / userid / "classes" / class_id
#     student_class_folder.mkdir(parents=True, exist_ok=True)
#
#     template_file = class_folder / "template.json"
#     if not template_file.exists():
#         raise ValueError(f"Template not found for class {class_id}")
#
#     template_json = load_json(template_file)
#     student_progress = {"modules": {}}
#
#     first_module = True
#
#     for module_id, module in template_json.get("modules", {}).items():
#         student_module = {
#             "id": module_id,
#             "name": module["name"],
#             "completed": False,
#             "unlocked": first_module,
#             "lessons": {}
#         }
#         first_module = False
#
#         for lesson_id, lesson in module.get("lessons", {}).items():
#             student_lesson = {
#                 "id": lesson_id,
#                 "content": lesson["content"],
#                 "completed": False,
#                 "questions": {}
#             }
#
#             # Copy questions per level
#             for q in lesson.get("questions", []):
#                 lvl = q["level"]
#                 student_lesson["questions"].setdefault(lvl, [])
#                 student_lesson["questions"][lvl].append({
#                     "id": q["id"],
#                     "content": q["content"],
#                     "solution": q["solution"],
#                     "solution_feedback": q.get("solution_feedback"),
#                     "hints": q.get("hints", ["No hint"]),
#                     "correct": None,
#                     "time_taken": None
#                 })
#
#             # Assign MMR / Elo for this lesson
#             mmr_scores = assign_mmr_for_lesson(student_lesson["questions"])
#             for lvl, qs in student_lesson["questions"].items():
#                 for q in qs:
#                     q["rating"] = mmr_scores.get(q["id"], 1000)  # default 1000 if missing
#
#             student_module["lessons"][lesson_id] = student_lesson
#
#         student_progress["modules"][module_id] = student_module
#
#     write_json(student_class_folder / "progress.json", student_progress)
#
#     # Update class meta to include student
#     meta_file = class_folder / "meta.json"
#     if meta_file.exists():
#         meta = load_json(meta_file)
#         if userid not in meta.get("enrolled_students", []):
#             meta.setdefault("enrolled_students", []).append(userid)
#             write_json(meta_file, meta)

def create_questions_for_student(userid: str, class_id: str):
    """
    Generate progress.json for a student using a lesson-only structure:
      - correct / time_taken / rating (MMR)
      - first lesson unlocked
    """
    class_folder = CLASSES_FOLDER / class_id
    student_class_folder = USERSFOLDER / userid / "classes" / class_id
    student_class_folder.mkdir(parents=True, exist_ok=True)

    template_file = class_folder / "template.json"
    if not template_file.exists():
        raise ValueError(f"Template not found for class {class_id}")
    profile_file = USERSFOLDER / userid / "profile.json"
    if not profile_file.exists():
        raise ValueError(f"Profile not found for user {userid}")

    template_json = load_json(template_file)
    student_progress = {"lessons": {}}
    profile_json = load_json(profile_file)
    question_theme = profile_json["theme"]

    # Track whether it's the first lesson to unlock
    first_lesson = True

    for lesson_id, lesson in template_json.items():
        student_lesson = {
            "id": lesson_id,
            "title": lesson.get("title", lesson_id),
            "content": lesson["content"],
            "completed": False,
            "unlocked": first_lesson,
            "questions": {}
        }
        first_lesson = False

        # Copy questions per difficulty level
        for q in lesson.get("questions", []):
            lvl = q["level"]
            student_lesson["questions"].setdefault(lvl, [])
            student_lesson["questions"][lvl].append({
                "id": q["id"],
                "content": q["content"],
                "solution": q["solution"],
                "solution_feedback": q.get("solution_feedback"),
                "hints": q.get("hints", ["No hint provided"]),
                "correct": False,
                "time_taken": None,
            })

        student_progress["lessons"][lesson_id] = student_lesson

    # Save progress
    write_json(student_class_folder / "progress.json", student_progress)

    # cannot hard code adding here, this is because if a teacher uploads their own lesson this doesnt work.
    # generate_practice_problems(userid, class_id, "Adding", question_theme)

    # generate questions for first lesson id
    for lesson_id in student_progress["lessons"]:
        generate_practice_problems(userid, class_id, lesson_id, question_theme)
        break

    # Update class meta to include student
    meta_file = class_folder / "meta.json"
    if meta_file.exists():
        meta = load_json(meta_file)
        if userid not in meta.get("enrolled_students", []):
            meta.setdefault("enrolled_students", []).append(userid)
            write_json(meta_file, meta)


def register_class(class_name: str, description="", template_questions=None, teacher_userid=None,
                   copy_default_html=False) -> str:
    class_id = str(uuid.uuid4())
    append_csv(
        CLASSES_CSV,
        [class_id, class_name, teacher_userid, description, datetime.now().isoformat()],
        header=["class_id", "class_name", "teacher_id", "description", "created_at"]
    )

    class_folder = CLASSES_FOLDER / class_id
    class_folder.mkdir(parents=True, exist_ok=True)

    # Save class meta
    write_json(class_folder / "meta.json", {
        "class_name": class_name,
        "enrolled_students": []
    })

    # quick patch job to copy the default math content into the users class
    if copy_default_html:
        content_folder = class_folder / "content"
        content_folder.mkdir(parents=True, exist_ok=True)

        for html_file in HTML_CONTENT_SRC.iterdir():
            if html_file.suffix == ".html":
                copy2(html_file, content_folder / html_file.name)

    if template_questions:
        normalized_template = normalize_template(template_questions)
        write_json(class_folder / "template.json", normalized_template)

    return class_id


def upload_teacher_class(teacher_userid: str, class_name: str, template_questions: dict, description=""):
    class_id = register_class(class_name, description, template_questions, teacher_userid)
    print(f"Teacher {teacher_userid} uploaded class '{class_name}' with class_id {class_id}")
    return class_id


def leave_class(student_userid: str, class_id: str):
    """Student leaves a teacher class."""

    # Remove from student folder
    student_class_folder = USERSFOLDER / student_userid / "classes" / class_id
    if student_class_folder.exists():
        import shutil
        shutil.rmtree(student_class_folder)

    # Remove from class meta
    meta_file = CLASSES_FOLDER / class_id / "meta.json"
    if meta_file.exists():
        meta = load_json(meta_file)
        meta["enrolled_students"] = [s for s in meta.get("enrolled_students", []) if s != student_userid]
        write_json(meta_file, meta)


def get_class_progress(userid: str, class_id: str):
    """Return progress.json for student"""
    progress_file = USERSFOLDER / userid / "classes" / class_id / "progress.json"
    if progress_file.exists():
        return load_json(progress_file)
    return None


def join_teacher_class(student_userid: str, class_id: str):
    """
    Student joins an existing teacher class.
    Copies template and generates progress.
    Updates class meta to include student.
    """
    create_questions_for_student(student_userid, class_id)
    print(f"Student {student_userid} joined class {class_id}")
