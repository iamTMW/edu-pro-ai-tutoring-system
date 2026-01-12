import csv
from class_utils import join_teacher_class

from datetime import datetime

from constants import Role, AUTH_TABLE, USERSFOLDER
from helpers import append_csv, write_json
from user_utils import hash_password, generate_new_student
import uuid

def str_to_role(role_str: str) -> Role:
    return Role[role_str.upper()]

def user_exists(username: str) -> bool:
    with open(AUTH_TABLE, newline="") as f:
        reader = csv.DictReader(f)
        return any(row["username"] == username for row in reader)

def add_user_to_auth_table(userid: str, username: str, hashed_pw: str, role: Role):
    append_csv(AUTH_TABLE, [userid, username, hashed_pw, role.name], header=["userid", "username", "password", "role"])

# handle sign up and creating default math class
# setup_new_user.py
def signup(username: str, password: str, role: str, class_id, security_qas, theme: str, student_ids=None):
    """
    security_qas: list of dicts like [{"question": "Your pet?", "answer": "Fluffy"}, ...]
    student_ids: optional list of student IDs for parents
    class_id: for STUDENT this is an optional *teacher* class code.
              If empty/None, student just gets the default math setup.
    """
    if user_exists(username):
        return False, None

    userid = str(uuid.uuid4())
    hashed_pw = hash_password(password)
    role_enum = str_to_role(role)
    student_ids = student_ids or []

    # Prepare security answers
    flat_qas = []
    if security_qas:
        qa_hashes = [hash_password(qa["answer"]) for qa in security_qas]
        for i in range(3):
            if i < len(security_qas):
                flat_qas.append(security_qas[i]["question"])
                flat_qas.append(qa_hashes[i])
            else:
                flat_qas.extend(["", ""])
    else:
        flat_qas = ["", "", "", "", "", ""]

    # Append to auth table
    append_csv(
        AUTH_TABLE,
        [userid, username, hashed_pw, role_enum.name] + flat_qas,
        header=[
            "userid", "username", "hashed_password", "role",
            "question1", "answer1_hash",
            "question2", "answer2_hash",
            "question3", "answer3_hash",
        ],
    )

    # ---- Role-specific handling ----
    if role_enum == Role.STUDENT:
        # Always create the student's default math setup
        generate_new_student(userid, username, theme, None)

        # If they provided a class code, also join that teacher class
        if class_id:
            try:
                join_teacher_class(userid, class_id)
            except Exception as e:
                # Don't blow up signup if class code is bad; just log it.
                print(f"[WARN] Failed to join teacher class {class_id} for {userid}: {e}")

    elif role_enum == Role.TEACHER:
        profile_data = {
            "userid": userid,
            "username": username,
            "role": "TEACHER",
            "theme": theme,
            "created_at": datetime.now().isoformat(),
            "last_login": datetime.now().isoformat(),
            "last_active": None,
            "classes_created": [],
        }
        write_json(USERSFOLDER / userid / "profile.json", profile_data)

    elif role_enum == Role.PARENT:
        profile_data = {
            "userid": userid,
            "username": username,
            "role": "PARENT",
            "theme": theme,
            "student_ids": student_ids,
            "created_at": datetime.now().isoformat(),
            "last_login": datetime.now().isoformat(),
            "last_active": None,
        }
        write_json(USERSFOLDER / userid / "profile.json", profile_data)

    print(f"User '{username}' created successfully with role '{role_enum.name}' and id '{userid}'")
    return True, userid



