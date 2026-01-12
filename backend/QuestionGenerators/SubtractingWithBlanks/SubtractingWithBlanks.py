import random


def generate_easy():
    a, b = sorted([random.randint(1, 10), random.randint(1, 10)], reverse=True)  # a >= b

    # Randomly hide one number
    if random.choice([True, False]):
        # Hide the minuend
        question = f"_ - {b} = {a - b}"
        answer = a
    else:
        # Hide the subtrahend
        question = f"{a} - _ = {a - b}"
        answer = b

    return question, answer


def generate_medium():
    a, b = sorted([random.randint(1, 25), random.randint(1, 10)], reverse=True)  # a >= b

    if random.choice([True, False]):
        question = f"_ - {b} = {a - b}"
        answer = a
    else:
        question = f"{a} - _ = {a - b}"
        answer = b

    return question, answer


def generate_hard():
    a, b = sorted([random.randint(10, 50), random.randint(1, 25)], reverse=True)  # a >= b

    if random.choice([True, False]):
        question = f"_ - {b} = {a - b}"
        answer = a
    else:
        question = f"{a} - _ = {a - b}"
        answer = b

    return question, answer


def generate_question(level):
    if level == "easy":
        return generate_easy()
    elif level == "medium":
        return generate_medium()
    elif level == "hard":
        return generate_hard()
    else:
        raise ValueError("Invalid level: choose 'easy', 'medium', or 'hard'")
