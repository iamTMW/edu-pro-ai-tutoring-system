import random

def generate_easy():
    a = random.randint(1, 10)
    b = random.randint(1, 10)
    # Ensure positive result
    a, b = max(a, b), min(a, b)
    question = f"{a} - {b} ="
    answer = a - b
    return question, answer

def generate_medium():
    choice = random.choice(["AA-B", "A-BB", "AA-BB"])

    if choice == "AA-B":
        a = random.randint(10, 50)
        b = random.randint(1, 10)
    elif choice == "A-BB":
        b = random.randint(10, 50)
        a = random.randint(b, b + 10)  # ensure a >= b
    else:  # AA-BB
        a = random.randint(10, 50)
        b = random.randint(10, a)  # ensure a >= b

    question = f"{a} - {b} ="
    answer = a - b
    return question, answer

def generate_hard():
    choice = random.randint(2, 3)

    if choice == 2:
        a = random.randint(1, 50)
        b = random.randint(0, a)  # ensure a >= b
        question = f"{a} - {b} ="
        answer = a - b
    else:
        # three-term subtraction
        a = random.randint(1, 50)
        b = random.randint(0, a)  # ensure a - b >= 0
        c = random.randint(0, a - b)  # ensure a - b - c >= 0
        question = f"{a} - {b} - {c} ="
        answer = a - b - c

    return question, answer

def generate_question(level):
    if level == "easy":
        return generate_easy()
    if level == "medium":
        return generate_medium()
    if level == "hard":
        return generate_hard()
