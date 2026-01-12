import csv
from datetime import datetime
from pathlib import Path

from constants import USERSFOLDER, AUTH_TABLE, CLASSES_CSV
from helpers import write_json, load_json, get_user_if_valid
from class_utils import register_class, create_questions_for_student
from helpers import hash_password
from QuestionGenerators import generate_student_questions


def generate_new_student(userid: str, username: str, theme : str, class_id=None, class_name="default_math"):
    user_folder = USERSFOLDER / userid
    user_folder.mkdir(parents=True, exist_ok=True)

    # create a default math class
    if class_id is None:
        # each student gets default math class, give it a unique class_id
        template_questions = generate_student_questions(userid)

        # only copy HTMLs for personal math class
        class_id = register_class(class_name, teacher_userid=0, description="Default math class",
                                  template_questions=template_questions, copy_default_html=True)

    # Profile
    profile_data = {
        "userid": userid,
        "username": username,
        "role": "STUDENT",
        "enrolled_classes": [class_id],
        "theme": theme,
        "colour_themes": "light",
        "created_at": datetime.now().isoformat(),
        "last_login": datetime.now().isoformat(),
        "last_active": None
    }
    write_json(user_folder / "profile.json", profile_data)

    # Questions + progress
    create_questions_for_student(userid, class_id)


def get_user_profile(userid: str):
    profile_file = USERSFOLDER / userid / "profile.json"
    if profile_file.exists():
        return load_json(profile_file)
    return None


def get_user_classes(userid: str):
    classes_folder = USERSFOLDER / userid / "classes"
    if not classes_folder.exists():
        return []

    result = []

    # Load all classes from CSV once
    classes_data = []
    with open(CLASSES_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        classes_data = list(reader)

    for c in classes_folder.iterdir():
        if not c.is_dir():
            continue

        cid = c.name  # folder name IS the classid

        # Find matching class row
        row = next((r for r in classes_data if r["classid"] == cid), None)
        if not row:
            continue

        result.append({
            "classid": row["classid"],
            "class_name": row["class_name"],
            "teacher_id": row["teacher_id"],
            "description": row["description"],
            "created_at": row["created_at"],
        })

    return result





def change_password(username: str, old_password: str, new_password: str):
    # check if old password is correct
    user = get_user_if_valid(username, old_password)
    if not user:
        return False, "Old password incorrect"

    # first we need to read the whole csv into a list
    rows = []
    with open(AUTH_TABLE, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["username"] == username:
                row["password"] = hash_password(new_password)  # update password
            rows.append(row)

    # overwrite CSV with updated row
    with open(AUTH_TABLE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    return True, "Password updated"
