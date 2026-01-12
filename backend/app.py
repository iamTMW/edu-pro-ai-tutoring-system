import csv
import shutil
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import os
from pathlib import Path
import json
from constants import (
    CLASSES_CSV,
    CLASSES_FOLDER,
    USERSFOLDER,
    AUTH_TABLE,
    QUESTION_GENERATORS,
    HTML_CONTENT_SRC,
)
from helpers import (
    get_user_if_valid,
    load_json,
    write_json,
    hash_password,
    generate_practice_problems,
)
from user_utils import change_password
from setup_new_user import signup
from collections import OrderedDict

from class_utils import (
    register_class,
    join_teacher_class,
    leave_class,
    get_class_progress,
)
from user_utils import get_user_profile, get_user_classes

app = Flask(__name__)
CORS(app, supports_credentials=True)  # Enables CORS for all routes


# Auto-initialize data files on startup
def ensure_data_files():
    """Ensure data files exist, create from templates if needed."""
    from init_data import init_data_files

    try:
        init_data_files()
    except Exception as e:
        print(f"Warning: Could not initialize data files: {e}")


# Run initialization check on startup
ensure_data_files()


@app.route("/new-user-setup", methods=["POST"])
def new_user_setup():
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    # optional fields
    email = data.get("email", "")

    student_ids = data.get("student_ids", [])  # for parents

    # SECURITY QUESTIONS
    security_qas = data.get("security_qas", [])
    theme = data.get("theme")

    # NEW: optional class code for students
    class_code = data.get("class_code")

    success, userid = signup(
        username=username,
        password=password,
        role=role,
        class_id=class_code if role and role.lower() == "student" else None,
        security_qas=security_qas,
        theme=theme,
        student_ids=student_ids,  # pass along student IDs
    )

    if success:
        return jsonify(
            {
                "success": True,
                "userid": userid,
                "username": username,
                "role": role.upper(),
                "email": email,
                "message": "User created successfully",
            }
        )

    return jsonify({"success": False, "message": "Username already exists"}), 400


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    print("Login attempt:", username, password)

    user = get_user_if_valid(username, password)
    if user:
        print("Login success for", username)
        return jsonify(
            {
                "success": True,
                "userid": user["userid"],
                "username": user["username"],
                "role": user["role"],
            }
        )
    else:
        print("Login failed for", username)
        return jsonify({"success": False, "message": "Invalid username or password"}), 401


@app.route("/change-password", methods=["POST"])
def api_change_password():
    data = request.get_json()
    username = data.get("username")
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not username or not old_password or not new_password:
        return jsonify({"success": False, "message": "All fields are required"}), 400

    success, msg = change_password(username, old_password, new_password)
    return jsonify({"success": success, "message": msg})


# app.py
@app.route("/forgot-password/reset", methods=["POST"])
def forgot_password():
    """
    Expects: {"username": "user123", "answer": "Fluffy", "new_password": "newpass"}
    """
    data = request.get_json()
    username = data.get("username")
    answer = data.get("answer")
    new_password = data.get("new_password")

    if not username or not answer or not new_password:
        return jsonify({"success": False, "message": "All fields are required"}), 400

    # Find user in auth table
    with open(AUTH_TABLE, newline="") as f:
        reader = csv.DictReader(f)
        user_row = next((r for r in reader if r["username"] == username), None)

    if not user_row:
        return jsonify({"success": False, "message": "User not found"}), 404

    # Randomly select a question to verify (or pick the first non-empty one)
    for i in range(1, 4):
        q_col = f"question{i}"
        a_col = f"answer{i}_hash"
        if user_row[q_col]:
            if hash_password(answer) == user_row[a_col]:
                # Correct answer, update password
                new_hashed_pw = hash_password(new_password)
                update_password_in_csv(username, new_hashed_pw)
                return jsonify(
                    {"success": True, "message": "Password reset successfully"}
                )
            else:
                return jsonify({"success": False, "message": "Incorrect answer"}), 401

    return jsonify({"success": False, "message": "No security question found"}), 400


def update_password_in_csv(username, new_hashed_pw):
    """Overwrite the CSV row for a user with a new password."""
    rows = []
    with open(AUTH_TABLE, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["username"] == username:
                row["hashed_password"] = new_hashed_pw
            rows.append(row)

    with open(AUTH_TABLE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=reader.fieldnames)
        writer.writeheader()
        writer.writerows(rows)


@app.route("/forgot-password/question", methods=["POST"])
def forgot_password_question():
    """
    Step 1: given a username, return a random security question (without the answer)
    """
    data = request.get_json()
    username = data.get("username")

    if not username:
        return jsonify({"success": False, "message": "Missing username"}), 400

    # Find user
    with open(AUTH_TABLE, newline="") as f:
        reader = csv.DictReader(f)
        user_row = next((r for r in reader if r["username"] == username), None)

    if not user_row:
        return jsonify({"success": False, "message": "User not found"}), 404

    # Pick the first non-empty question
    for i in range(1, 4):
        q_col = f"question{i}"
        if user_row[q_col]:
            return jsonify({"success": True, "question": user_row[q_col]})

    return jsonify({"success": False, "message": "No security question found"}), 400


# list of possible themes a user can pick from, we can add more or have it read from a file
@app.route("/available-themes")
def available_themes():
    return jsonify(
        [
            "Soccer",
            "Hockey",
            "Toys",
            "Pokemon",
            "Video Games",
            "Cars",
            "Fairies",
            "Horses",
            "Dolls",
        ]
    )


# get or update user theme
@app.route("/user/theme", methods=["GET", "POST"])
def user_theme():
    data = request.get_json() or {}
    userid = data.get("userid")

    print(f"{userid} retrieving their themes")

    if not userid:
        return jsonify({"success": False, "message": "Missing userid"}), 400

    user_folder = USERSFOLDER / userid
    profile_file = user_folder / "profile.json"

    # Load profile
    profile = {}
    if profile_file.exists():
        profile = load_json(profile_file)

    if request.method == "POST":
        # Update theme
        theme = data.get("theme")
        if not theme:
            return jsonify({"success": False, "message": "Missing theme"}), 400

        profile["theme"] = theme
        write_json(profile_file, profile)
        return jsonify({"success": True, "message": f"Theme updated to {theme}"})

    # return current theme
    current_theme = profile.get("theme", None)

    print(current_theme)

    return jsonify({"success": True, "theme": current_theme})


# ---------- CLASS CREATION + LESSON CONTENT ----------

# use the existing default class as the template for all new classes
DEFAULT_TEMPLATE_CLASS = "default_math"


def _load_default_template():
    """
    Load the questions template for the default class
    (e.g., classes/default_math/template.json).
    """
    template_dir = CLASSES_FOLDER / DEFAULT_TEMPLATE_CLASS
    template_json = template_dir / "template.json"

    if not template_json.exists():
        raise FileNotFoundError(f"Template class '{DEFAULT_TEMPLATE_CLASS}' not found")

    with open(template_json, "r", encoding="utf-8") as f:
        template_questions = json.load(f)

    return template_questions


# ---------- CLASS CREATION + LESSON CONTENT ----------

# @app.route("/teacher/create-class", methods=["POST"])
# def teacher_create_class():
#     """
#     Create a new class for a teacher.
#     Uses `default_math` as the template so new classes get the same
#     lessons/questions structure and can create progress.json correctly.
#     """
#     data = request.get_json() or {}
#     userid = data.get("userid")
#     class_name = data.get("class_name")
#     description = data.get("description", "")
#
#     if not userid or not class_name:
#         return jsonify({"success": False, "message": "Missing userid or class_name"}), 400
#
#     # Load template questions from default_math
#     try:
#         template_questions = _load_default_template()
#     except FileNotFoundError as e:
#         return jsonify({"success": False, "message": str(e)}), 500
#
#     class_id = register_class(
#         class_name=class_name,
#         description=description,
#         template_questions=template_questions,  # <-- KEY FIX
#         teacher_userid=userid,
#         copy_default_html=False,  # you’re already serving HTML from HTML_CONTENT_SRC
#     )
#
#     return jsonify({"success": True, "class_id": class_id})

@app.route("/teacher/create-class", methods=["POST"])
def upload_teacher_class():
    """
    Accept multipart/form-data with:
      - 'userid'
      - 'class_name'
      - 'description'
      - 'template' (JSON file)
      - HTML lesson files
    """
    teacher_userid = request.form.get("userid")
    class_name = request.form.get("class_name")
    description = request.form.get("description", "")

    if not teacher_userid or not class_name:
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    # Parse template JSON
    template_file = request.files.get("template")
    if not template_file:
        return jsonify({"success": False, "message": "Missing template.json"}), 400

    template_questions = json.load(template_file.stream)

    # create a new class id for the class the prof created
    class_id = register_class(class_name, description, template_questions, teacher_userid)

    # create the content folder for each class
    class_folder = CLASSES_FOLDER / class_id
    content_folder = class_folder / "content"
    content_folder.mkdir(parents=True, exist_ok=True)

    # Save all HTML files
    for key, file in request.files.items():
        if key.startswith("lesson_") and file.filename.endswith(".html"):
            file.save(content_folder / file.filename)

    return jsonify({"success": True, "class_id": class_id})


@app.route("/lesson-content", methods=["POST"])
def get_lesson_content():
    """
    Return HTML lesson content.
    All classes share the same lessons, loaded from HTML_CONTENT_SRC.
    """
    data = request.get_json() or {}
    class_id = data.get("class_id")  # kept for API compatibility, not used
    lesson_id = data.get("lesson_id")

    if not class_id or not lesson_id:
        return jsonify({"success": False, "message": "Missing class_id or lesson_id"}), 400

    # Always load from global source folder
    content_path = CLASSES_FOLDER / f"{class_id}/content/{lesson_id}.html"  # f"{lesson_id}.html"

    print(content_path)

    if not content_path.exists():
        return jsonify({"success": False, "message": "Lesson not found"}), 404

    with open(content_path, "r", encoding="utf-8") as f:
        html = f.read()

    return jsonify({"success": True, "lesson_id": lesson_id, "html": html})


# for viewing list of students in a class
@app.route("/teacher/students", methods=["POST"])
def teacher_students():
    data = request.get_json() or {}
    class_id = data.get("class_id")

    print(f"Viewing students in {class_id}")

    if not class_id:
        return jsonify({"success": False, "message": "Missing class_id"}), 400

    meta_file = CLASSES_FOLDER / class_id / "meta.json"
    if not meta_file.exists():
        return jsonify({"success": False, "message": "Class not found"}), 404

    with open(meta_file) as f:
        meta = json.load(f)
    students = meta.get("enrolled_students", [])

    print(students)

    return jsonify({"success": True, "students": students})


# get the class progress
@app.route("/teacher/progress", methods=["POST"])
def teacher_progress():
    data = request.get_json() or {}
    class_id = data.get("class_id")

    print(f"Get Class Progress For {class_id}")

    if not class_id:
        return jsonify({"success": False, "message": "Missing class_id"}), 400

    meta_file = CLASSES_FOLDER / class_id / "meta.json"
    if not meta_file.exists():
        return jsonify({"success": False, "message": "Class not found"}), 404

    with open(meta_file) as f:
        meta = json.load(f)

    students_progress = {}
    for student_id in meta.get("enrolled_students", []):
        students_progress[student_id] = get_class_progress(student_id, class_id)

    print(students_progress)

    return jsonify({"success": True, "students_progress": students_progress})


@app.route("/student/join-class", methods=["POST"])
def api_join_class():
    data = request.get_json() or {}
    student_userid = data.get("student_userid")
    class_id = data.get("class_id")

    print(f"Student {student_userid} joining {class_id}")

    if not student_userid or not class_id:
        return jsonify({"success": False, "message": "Missing student_userid or class_id"}), 400

    join_teacher_class(student_userid, class_id)

    print("Joined!")

    return jsonify({"success": True, "message": f"Student joined class {class_id}"})


@app.route("/student/leave-class", methods=["POST"])
def api_leave_class():
    data = request.get_json() or {}
    student_userid = data.get("student_userid")
    class_id = data.get("class_id")

    print(f"Student {student_userid} leaving {class_id}")

    if not student_userid or not class_id:
        return jsonify({"success": False, "message": "Missing student_userid or class_id"}), 400

    leave_class(student_userid, class_id)

    print("Left!")

    return jsonify({"success": True, "message": f"Student left class {class_id}"})


# get the progress for a student, requires their id and class id
@app.route("/student/progress", methods=["POST"])
def api_student_progress():
    data = request.get_json() or {}
    userid = data.get("userid")
    class_id = data.get("class_id")

    if not userid or not class_id:
        return jsonify({"success": False, "message": "Missing userid or class_id"}), 400

    print(f"Get Progress For {userid} in class {class_id}")

    progress = get_class_progress(userid, class_id)

    if progress:
        ordered_lessons = OrderedDict()
        for lesson_name in progress["lessons"]:
            ordered_lessons[lesson_name] = progress["lessons"][lesson_name]

        ordered_progress = OrderedDict()
        ordered_progress["lessons"] = ordered_lessons

        return Response(
            json.dumps({"success": True, "progress": ordered_progress}, ensure_ascii=False),
            mimetype="application/json",
        )

    return jsonify({"success": False, "message": "Class or student not found"}), 404


@app.route("/profile", methods=["POST"])
def get_profile():
    data = request.get_json() or {}
    userid = data.get("userid")

    print(f"Get profile for {userid}")

    if not userid:
        return jsonify({"success": False, "message": "Missing userid"}), 400

    profile = get_user_profile(userid)
    classes = get_user_classes(userid)

    print(profile)
    print(classes)

    return jsonify({"success": True, "profile": profile, "classes": classes})


# quick way to view the classes a student is enrolled in
@app.route("/student/classes", methods=["POST"])
def student_classes():
    data = request.get_json() or {}
    student_userid = data.get("userid")

    if not student_userid:
        return jsonify({"success": False, "message": "Missing userid"}), 400

    classes = get_user_classes(student_userid)

    print(f"{student_userid} in classes:")
    print(classes)

    return jsonify({"success": True, "classes": classes})


# quickly view a list of classes a teacher is part of
@app.route("/teacher/classes", methods=["POST"])
def teacher_classes():
    data = request.get_json() or {}
    teacher_userid = data.get("userid")

    print(f"Checking For {teacher_userid}")

    if not teacher_userid:
        return jsonify({"success": False, "message": "Missing userid"}), 400

    classes_list = []
    if CLASSES_CSV.exists():
        with open(CLASSES_CSV, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("teacher_id") == teacher_userid:
                    classes_list.append(row)

    print(classes_list)

    return jsonify({"success": True, "classes": classes_list})


# teacher deleted a class of theirs
@app.route("/teacher/delete-class", methods=["POST"])
def teacher_delete_class():
    data = request.get_json() or {}
    teacher_userid = data.get("userid")
    class_id = data.get("class_id")

    if not teacher_userid or not class_id:
        return jsonify({"success": False, "message": "Missing userid or class_id"}), 400

    rows = []
    deleted = False

    if CLASSES_CSV.exists():
        with open(CLASSES_CSV, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row["class_id"] == class_id:
                    if row.get("teacher_userid") != teacher_userid:
                        return jsonify({"success": False, "message": "Not authorized"}), 403
                    deleted = True
                    continue
                rows.append(row)

        with open(CLASSES_CSV, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=reader.fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    # Load meta.json to remove student references
    meta_file = CLASSES_FOLDER / class_id / "meta.json"
    if meta_file.exists():
        with open(meta_file) as f:
            meta = json.load(f)

        # Remove class from each student's enrolled classes
        for student_id in meta.get("enrolled_students", []):
            student_class_folder = USERSFOLDER / student_id / "classes" / class_id
            if student_class_folder.exists():
                shutil.rmtree(student_class_folder)

    # Delete the class folder itself
    class_folder = CLASSES_FOLDER / class_id
    if class_folder.exists():
        shutil.rmtree(class_folder)

    if deleted:
        return jsonify({"success": True, "message": f"Class {class_id} deleted"})
    else:
        return jsonify({"success": False, "message": "Class not found"}), 404


@app.route("/parent/students", methods=["POST"])
def parent_students():
    data = request.get_json() or {}
    parent_id = data.get("parent_userid")

    if not parent_id:
        return jsonify({"success": False, "message": "Missing parent_userid"}), 400

    profile_file = USERSFOLDER / parent_id / "profile.json"
    if not profile_file.exists():
        return jsonify({"success": False, "message": "Parent profile not found"}), 404

    profile = load_json(profile_file)
    student_ids = profile.get("student_ids", [])

    return jsonify({"success": True, "students": student_ids})


# update a question with a time and if its correct or not
@app.route("/student/update-question", methods=["POST"])
def update_question():
    """
    Update the stats for a single question in a lesson.
    Expected JSON:
    {
        "userid": "",
        "class_id": "",
        "lesson_id": "",
        "question_id": "",
        "correct": true/false,
        "time_taken": seconds (int)
    }
    """
    data = request.json
    userid = data.get("userid")
    class_id = data.get("class_id")
    lesson_id = data.get("lesson_id")
    question_id = data.get("question_id")
    correct = data.get("correct")
    time_taken = data.get("time_taken", 0)

    # Validate input
    if None in [userid, class_id, lesson_id, question_id, correct]:
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    try:
        time_taken = int(time_taken)
    except (ValueError, TypeError):
        time_taken = 0

    progress_file = USERSFOLDER / userid / "classes" / class_id / "progress.json"
    if not progress_file.exists():
        return jsonify({"success": False, "message": "Progress not found"}), 404

    progress = load_json(progress_file)
    lesson = progress["lessons"].get(lesson_id)
    if not lesson:
        return jsonify({"success": False, "message": "Lesson not found"}), 404

    found = False
    for lvl, questions in lesson["questions"].items():
        for q in questions:
            if q["id"] == question_id:
                q["correct"] = bool(correct)
                q["time_taken"] = time_taken
                found = True
                break
        if found:
            break

    if not found:
        return jsonify({"success": False, "message": "Question not found"}), 404

    write_json(progress_file, progress)
    return jsonify({"success": True, "message": f"Question {question_id} updated", "time_taken": time_taken})



def write_json_atomic(path: Path, data):
    """Write JSON atomically using a temporary file."""
    temp_path = path.with_suffix(".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.replace(temp_path, path)  # atomic on most OS


# mark a lesson as complete, will unlock the next one if it exists
@app.route("/student/complete-lesson", methods=["POST"])
def complete_lesson():
    """
    Mark a lesson as completed and unlock the next lesson automatically (if exists)
    {"userid": "", "class_id": "", "lesson_id": ""}
    """
    data = request.json
    userid = data.get("userid")
    class_id = data.get("class_id")
    lesson_id = data.get("lesson_id")

    print(f"{userid} finished lesson in {class_id} for {lesson_id}")

    if not userid or not class_id or not lesson_id:
        return jsonify(
            {"success": False, "message": "Missing userid, class_id, or lesson_id"}
        ), 400

    progress_file = USERSFOLDER / userid / "classes" / class_id / "progress.json"
    if not progress_file.exists():
        return jsonify({"success": False, "message": "Progress not found"}), 404
    profile_file = USERSFOLDER / userid / "profile.json"
    if not profile_file.exists():
        return jsonify({"success": False, "message": "Profile not found"}), 404

    progress = load_json(progress_file)
    profile = load_json(profile_file)
    lesson_keys = list(progress["lessons"].keys())

    if lesson_id not in lesson_keys:
        return jsonify({"success": False, "message": "Lesson not found"}), 404

    # Mark this lesson as completed
    lesson = progress["lessons"][lesson_id]
    lesson["completed"] = True

    # Unlock the next lesson (if any)
    unlocked_lesson_id = None
    idx = lesson_keys.index(lesson_id)
    if idx + 1 < len(lesson_keys):
        next_lesson_id = lesson_keys[idx + 1]
        progress["lessons"][next_lesson_id]["unlocked"] = True
        unlocked_lesson_id = next_lesson_id

    # Atomic write
    write_json_atomic(progress_file, progress)

    question_theme = profile["theme"]
    generate_practice_problems(userid, class_id, unlocked_lesson_id, question_theme)

    resp = {"success": True, "completed_lesson": lesson_id}
    if unlocked_lesson_id:
        resp["unlocked_lesson"] = unlocked_lesson_id
        resp["message"] = (
            f"Lesson {lesson_id} completed, next lesson {unlocked_lesson_id} unlocked"
        )
    else:
        resp["message"] = f"Lesson {lesson_id} completed"

    return jsonify(resp)


# get the progress for a user, there might be something already that does this
@app.route("/student/get-progress", methods=["GET"])
def get_progress():
    userid = request.args.get("userid")
    class_id = request.args.get("class_id")

    progress_file = USERSFOLDER / userid / "classes" / class_id / "progress.json"
    if not progress_file.exists():
        return jsonify({"success": False, "message": "Progress not found"}), 404

    progress = load_json(progress_file)
    return jsonify({"success": True, "progress": progress})


@app.route("/parent/add-student", methods=["POST"])
def parent_add_student():
    data = request.get_json() or {}
    parent_id = data.get("parent_userid")
    student_id = data.get("student_id")

    if not parent_id or not student_id:
        return jsonify(
            {"success": False, "message": "Missing parent_userid or student_id"}
        ), 400

    profile_file = USERSFOLDER / parent_id / "profile.json"
    if not profile_file.exists():
        return jsonify({"success": False, "message": "Parent profile not found"}), 404

    profile = load_json(profile_file)
    student_ids = profile.get("student_ids", [])

    if student_id in student_ids:
        return jsonify({"success": False, "message": "Student already added"}), 400

    student_ids.append(student_id)
    profile["student_ids"] = student_ids
    write_json(profile_file, profile)

    return jsonify({"success": True, "message": f"Student {student_id} added"})


@app.route("/parent/remove-student", methods=["POST"])
def parent_remove_student():
    data = request.get_json() or {}
    parent_id = data.get("parent_userid")
    student_id = data.get("student_id")

    if not parent_id or not student_id:
        return jsonify(
            {"success": False, "message": "Missing parent_userid or student_id"}
        ), 400

    profile_file = USERSFOLDER / parent_id / "profile.json"
    if not profile_file.exists():
        return jsonify({"success": False, "message": "Parent profile not found"}), 404

    profile = load_json(profile_file)
    student_ids = profile.get("student_ids", [])

    if student_id not in student_ids:
        return jsonify({"success": False, "message": "Student not in parent list"}), 400

    student_ids.remove(student_id)
    profile["student_ids"] = student_ids
    write_json(profile_file, profile)

    return jsonify({"success": True, "message": f"Student {student_id} removed"})


@app.route("/parent/students-progress", methods=["POST"])
def parent_students_progress():
    data = request.get_json() or {}
    parent_id = data.get("parent_userid")

    if not parent_id:
        return jsonify({"success": False, "message": "Missing parent_userid"}), 400

    profile_file = USERSFOLDER / parent_id / "profile.json"
    if not profile_file.exists():
        return jsonify({"success": False, "message": "Parent profile not found"}), 404

    profile = load_json(profile_file)
    student_ids = profile.get("student_ids", [])

    students_progress = []

    for student_id in student_ids:
        student_profile = get_user_profile(student_id)
        student_classes = get_user_classes(student_id)
        progress_per_class = {}

        for class_info in student_classes:
            # Support both class_id and classid (and id as a fallback)
            class_id = (
                    class_info.get("class_id")
                    or class_info.get("classid")
                    or class_info.get("id")
            )

            if not class_id:
                # Skip bad entries instead of crashing
                print(
                    f"Skipping class with no id for student {student_id}: {class_info}"
                )
                continue

            progress_file = (
                    USERSFOLDER / student_id / "classes" / class_id / "progress.json"
            )
            if progress_file.exists():
                progress = load_json(progress_file)
                progress_per_class[class_id] = progress
            else:
                progress_per_class[class_id] = None  # No progress yet

        students_progress.append(
            {
                "student_id": student_id,
                "student_name": f"{student_profile.get('first_name', '')} {student_profile.get('last_name', '')}".strip(),
                "classes": progress_per_class,
            }
        )

    return jsonify({"success": True, "students_progress": students_progress})


# ---------- Leaderboard helpers + route (UPDATED) ----------


def _compute_points_from_progress(progress: dict) -> int:
    """
    Shared scoring logic:
    - 1 point per correct 'easy' question
    - 2 points per correct 'medium' question
    - 3 points per correct 'hard' question
    """
    lessons = progress.get("lessons", {})
    total_points = 0

    for lesson in lessons.values():
        questions_by_level = lesson.get("questions", {})
        for level, questions in questions_by_level.items():
            if level == "easy":
                weight = 1
            elif level == "medium":
                weight = 2
            else:  # "hard" or anything else
                weight = 3

            for q in questions:
                if q.get("correct") is True:
                    total_points += weight

    return total_points


def _get_class_row(class_id: str):
    """Return the row from CLASSES_CSV for a given class_id, or None."""
    if not CLASSES_CSV.exists():
        return None
    with open(CLASSES_CSV, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("class_id") == class_id:
                return row
    return None


@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    """
    If ?class_id=XYZ is provided:
      -> class-wide leaderboard for that specific class.

    If class_id is NOT provided:
      -> global leaderboard across ALL student accounts, summing
         points from all their classes.
    """
    class_id = request.args.get("class_id")

    # Load auth table to map userid -> (username, role)
    auth_rows = []
    userid_to_username = {}

    if AUTH_TABLE.exists():
        with open(AUTH_TABLE, newline="") as f:
            reader = csv.DictReader(f)
            auth_rows = list(reader)
            for row in auth_rows:
                uid = row.get("userid") or row.get("user_id") or row.get("id")
                if not uid:
                    continue
                userid_to_username[uid] = row.get("username", uid)

    def compute_points_for_class(userid: str, cid: str) -> int:
        progress_file = USERSFOLDER / userid / "classes" / cid / "progress.json"
        if not progress_file.exists():
            return 0
        progress = load_json(progress_file)
        return _compute_points_from_progress(progress)

    def compute_points_global(userid: str) -> int:
        """
        Sum points across ALL classes for a user.
        """
        user_classes_dir = USERSFOLDER / userid / "classes"
        if not user_classes_dir.exists():
            return 0

        total = 0
        for class_dir in user_classes_dir.iterdir():
            if not class_dir.is_dir():
                continue
            progress_file = class_dir / "progress.json"
            if not progress_file.exists():
                continue
            progress = load_json(progress_file)
            total += _compute_points_from_progress(progress)
        return total

    leaderboard_rows = []

    # ----- CLASS-SPECIFIC LEADERBOARD -----
    if class_id:
        meta_file = CLASSES_FOLDER / class_id / "meta.json"
        if not meta_file.exists():
            return jsonify({"success": False, "message": "Class not found"}), 404

        meta = load_json(meta_file)
        student_ids = meta.get("enrolled_students", [])

        for sid in student_ids:
            points = compute_points_for_class(sid, class_id)
            leaderboard_rows.append(
                {
                    "userid": sid,
                    "username": userid_to_username.get(sid, sid),
                    "points": points,
                }
            )

    # ----- GLOBAL LEADERBOARD (all students) -----
    else:
        for row in auth_rows:
            role = (row.get("role") or "").upper()
            if role != "STUDENT":
                continue

            uid = row.get("userid") or row.get("user_id") or row.get("id")
            if not uid:
                continue

            username = row.get("username", uid)
            points = compute_points_global(uid)

            leaderboard_rows.append(
                {
                    "userid": uid,
                    "username": username,
                    "points": points,
                }
            )

    # Highest score first
    leaderboard_rows.sort(key=lambda r: r["points"], reverse=True)

    return jsonify({"success": True, "leaderboard": leaderboard_rows})


@app.route("/teacher/set-deadline", methods=["POST"])
def teacher_set_deadline():
    """
    Teacher sets or updates a deadline for a lesson in a class.

    Body:
      {
        "userid": "<teacher_userid>",
        "class_id": "...",
        "lesson_id": "...",
        "deadline": "2025-12-01T23:59:59"
      }
    """
    data = request.get_json() or {}
    teacher_userid = data.get("userid")
    class_id = data.get("class_id")
    lesson_id = data.get("lesson_id")
    deadline = data.get("deadline")

    if not teacher_userid or not class_id or not lesson_id or not deadline:
        return jsonify({"success": False, "message": "Missing fields"}), 400

    class_row = _get_class_row(class_id)
    if not class_row:
        return jsonify({"success": False, "message": "Class not found"}), 404

    if class_row.get("teacher_userid") != teacher_userid:
        return jsonify({"success": False, "message": "Not authorized"}), 403

    meta_file = CLASSES_FOLDER / class_id / "meta.json"
    if not meta_file.exists():
        return jsonify({"success": False, "message": "Class meta not found"}), 404

    meta = load_json(meta_file)
    deadlines = meta.get("deadlines", {})
    deadlines[lesson_id] = deadline
    meta["deadlines"] = deadlines

    write_json(meta_file, meta)

    return jsonify({"success": True, "message": "Deadline updated", "deadlines": deadlines})


@app.route("/teacher/class-meta", methods=["POST"])
def teacher_class_meta():
    """
    Return meta.json for a class (including deadlines).
    Body: {"userid": "<teacher_userid>", "class_id": "..."}
    """
    data = request.get_json() or {}
    teacher_userid = data.get("userid")
    class_id = data.get("class_id")

    if not teacher_userid or not class_id:
        return jsonify({"success": False, "message": "Missing userid or class_id"}), 400

    class_row = _get_class_row(class_id)
    if not class_row:
        return jsonify({"success": False, "message": "Class not found"}), 404

    if class_row.get("teacher_userid") != teacher_userid:
        return jsonify({"success": False, "message": "Not authorized"}), 403

    meta_file = CLASSES_FOLDER / class_id / "meta.json"
    if not meta_file.exists():
        return jsonify({"success": False, "message": "Meta not found"}), 404

    meta = load_json(meta_file)
    return jsonify({"success": True, "meta": meta})


if __name__ == "__main__":
    app.run(debug=True)
