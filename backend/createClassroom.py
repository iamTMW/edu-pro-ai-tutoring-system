import requests
import json
import io

BASE_URL = "http://127.0.0.1:5000"


def print_title(title):
    print("\n" + "=" * 10 + f" {title} " + "=" * 10)


# ------------------- User APIs -------------------
def signup(username, password, role="student"):
    payload = {"username": username, "password": password, "role": role}
    r = requests.post(f"{BASE_URL}/new-user-setup", json=payload)
    data = r.json()
    print_title(f"Signup: {username} ({role})")
    print(json.dumps(data, indent=2))
    return data


def login(username, password):
    r = requests.post(f"{BASE_URL}/login", json={"username": username, "password": password})
    data = r.json()
    print_title(f"Login: {username}")
    print(json.dumps(data, indent=2))
    return data


def profile(userid):
    r = requests.post(f"{BASE_URL}/profile", json={"userid": userid})
    data = r.json()
    print_title(f"Profile for user {userid}")
    print(json.dumps(data, indent=2))
    return data


# ------------------- Class APIs -------------------
def create_class(teacher_userid, class_name, template, html_lessons=None, description="Test Class"):
    files = {"template": io.BytesIO(json.dumps(template).encode("utf-8"))}
    files["template"].name = "template.json"
    if html_lessons:
        for lesson_id, html_content in html_lessons.items():
            f = io.BytesIO(html_content.encode("utf-8"))
            f.name = f"{lesson_id}.html"
            files[lesson_id] = f
    data = {"userid": teacher_userid, "class_name": class_name, "description": description}
    r = requests.post(f"{BASE_URL}/teacher/create-class", data=data, files=files)
    data = r.json()
    print_title(f"Teacher creates class: {class_name}")
    print(json.dumps(data, indent=2))
    return data


def join_class(student_userid, class_id):
    payload = {"student_userid": student_userid, "class_id": class_id}
    r = requests.post(f"{BASE_URL}/student/join-class", json=payload)
    data = r.json()
    print_title(f"Student {student_userid} joins class {class_id}")
    print(json.dumps(data, indent=2))
    return data


def get_lesson_content(class_id, lesson_id):
    payload = {"class_id": class_id, "lesson_id": lesson_id}
    r = requests.post(f"{BASE_URL}/lesson-content", json=payload)
    data = r.json()
    print_title(f"Fetching lesson content for {lesson_id} in {class_id}")
    print(json.dumps(data, indent=2))
    return data


def complete_lesson(student_userid, class_id, lesson_id):
    """
    Marks a lesson as complete if the frontend decides the user passed the threshold.
    """
    payload = {
        "userid": student_userid,
        "class_id": class_id,
        "lesson_id": lesson_id
    }
    r = requests.post(f"{BASE_URL}/student/complete-lesson", json=payload)
    data = r.json()
    print_title(f"Student {student_userid} completes lesson {lesson_id}")
    print(json.dumps(data, indent=2))
    return data


def update_question(student_userid, class_id, lesson_id, question_id, correct=True, time_taken=30,
                    last_answer=None):
    """
    Updates a single question's stats without completing the lesson.
    """
    payload = {
        "userid": student_userid,
        "class_id": class_id,
        "lesson_id": lesson_id,
        "question_id": question_id,
        "correct": correct,
        "time_taken": time_taken,
        "last_answer": last_answer
    }
    r = requests.post(f"{BASE_URL}/student/update-question", json=payload)
    data = r.json()
    print_title(f"Student {student_userid} answers question {question_id}")
    print(json.dumps(data, indent=2))
    return data


def get_progress(student_userid, class_id):
    r = requests.get(f"{BASE_URL}/student/get-progress", params={"userid": student_userid, "class_id": class_id})
    data = r.json()
    print_title(f"Progress for student {student_userid} in class {class_id}")
    print(json.dumps(data, indent=2))
    return data


# ------------------- Full Walkthrough -------------------
if __name__ == "__main__":
    # ---------------- Teacher Setup ----------------
    teacher = signup("mr_smith", "pw", "teacher")
    teacher_login = login("mr_smith", "pw")
    teacher_userid = teacher_login.get("userid")

    # ---------------- Create Class ----------------
    template = {
        "lesson_001": [
            {"id": "q1", "level": "easy", "content": "Question 1 content", "solution": "2",
             "hints": ["Think about adding small numbers first"], "solution_feedback": "The answer is 2"},
            {"id": "q2", "level": "easy", "content": "Question 2 content", "solution": "5",
             "hints": ["Consider multiplication"], "solution_feedback": "The answer is 5"}
        ],
        "lesson_002": [
            {"id": "q3", "level": "medium", "content": "Question 3 content", "solution": "144",
             "hints": ["Think about squares"], "solution_feedback": "The answer is 144"}
        ],
        "lesson_003": [
            {"id": "q4", "level": "easy", "content": "Question 4 content", "solution": "10",
             "hints": ["Add all numbers"], "solution_feedback": "The answer is 10"}
        ]
    }

    html_lessons = {
        "lesson_001": "<div>Lesson 1 content</div>",
        "lesson_002": "<div>Lesson 2 content</div>",
        "lesson_003": "<div>Lesson 3 content</div>"
    }

    cls = create_class(teacher_userid, "Math101", template, html_lessons)
    class_id = cls.get("class_id")

    # ---------------- Student Setup ----------------
    student = signup("alice", "pw", "student")
    student_login = login("alice", "pw")
    student_userid = student_login.get("userid")

    join_class(student_userid, class_id)

    # ---------------- Student Lesson Flow ----------------
    progress_data = get_progress(student_userid, class_id)


    # lessons = progress_data.get("progress", {}).get("lessons", {})
    #
    # for lesson_id, lesson in lessons.items():
    #     get_lesson_content(class_id, lesson_id)
    #     questions_dict = lesson.get("questions", {})
    #
    #     # Answer questions
    #     for level, questions in questions_dict.items():
    #         for q in questions:
    #             update_question(
    #                 student_userid,
    #                 class_id,
    #                 lesson_id=lesson_id,
    #                 question_id=q["id"],
    #                 correct=True,
    #                 time_taken=20,
    #                 last_answer=q.get("solution")
    #             )
    #
    #     # Mark lesson as complete
    #     complete_lesson(student_userid, class_id, lesson_id)
    #
    # # ---------------- Final Progress ----------------
    # get_progress(student_userid, class_id)
