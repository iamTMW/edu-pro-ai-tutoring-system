import random


def generate_easy():
    a, b = sorted([random.randint(1, 10), random.randint(1, 10)], reverse=True)

    # Randomly decide which side is blank
    if random.choice([True, False]):
        question = f"{b} + _ = {a}"
        answer = a - b
    else:
        question = f"_ + {b} = {a}"
        answer = a - b

    return question, answer


def generate_medium():
    a, b = sorted([random.randint(1, 25), random.randint(1, 10)], reverse=True)

    if random.choice([True, False]):
        question = f"{b} + _ = {a}"
        answer = a - b
    else:
        question = f"_ + {b} = {a}"
        answer = a - b

    return question, answer


def generate_hard():
    a, b = sorted([random.randint(10, 50), random.randint(10, 50)], reverse=True)

    if random.choice([True, False]):
        question = f"{b} + __ = {a}"
        answer = a - b
    else:
        question = f"__ + {b} = {a}"
        answer = a - b

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
