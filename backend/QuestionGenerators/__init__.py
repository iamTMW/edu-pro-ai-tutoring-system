from .Adding import Adding
from .AddingWithBlanks import AddingWithBlanks
from .AddingWithNAmount import AddingWithNAmount
from .Subtracting import Subtracting
from .SubtractingWithBlanks import SubtractingWithBlanks
from .SubtractingWithNAmount import SubtractingWithNAmount

from .Adding_Subtracting_Review import Adding_Subtracting_Review
from .Adding_Subtracting_Review_Blanks import Adding_Subtracting_Review_Blanks
from .Adding_Subtracting_N_Amount_Review import Adding_Subtracting_N_Amount_Review

# Map lesson IDs to generator functions
lesson_generators = {
    "Adding": Adding.generate_question,
    "Subtracting": Subtracting.generate_question,
    "Review Adding Subtracting":Adding_Subtracting_Review.generate_question,
    "Adding With Blanks": AddingWithBlanks.generate_question,
    "Subtracting With Blanks": SubtractingWithBlanks.generate_question,
    "Review Adding Subtracting With Blanks":Adding_Subtracting_Review_Blanks.generate_question,
    "Adding With N Amount": AddingWithNAmount.generate_question,
    "Subtracting With N Amount": SubtractingWithNAmount.generate_question,
    "Adding Subtracting With N Amount Review" : Adding_Subtracting_N_Amount_Review.generate_question,
}


def generate_student_questions(student_id: str, lessons=None, questions_per_level=2):
    """
    Generate personalized questions for a new student.
    """
    if lessons is None:
        lessons = lesson_generators

    levels = ["easy", "medium", "hard"]
    student_questions = {}

    for lesson_id, generator in lessons.items():
        student_questions[lesson_id] = []
        for level in levels:
            for i in range(questions_per_level):
                q_text, ans = generator(level)
                question = {
                    "id": f"{lesson_id}_{level}_{i + 1}_{student_id[:6]}",
                    "level": level,
                    "content": q_text,
                    "hints": ["Try breaking the problem into smaller steps."],
                    "solution": str(ans),
                }
                student_questions[lesson_id].append(question)

    return student_questions


"""
"rating": 1000,
                    "last_answer": None,
                    "correct": None,
                    "time_taken": None
"""
