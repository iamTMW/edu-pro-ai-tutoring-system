import random


def generate_easy():
    a = random.randint(1, 10)
    b = random.randint(1, 10)
    question = f"{a} + {b} ="
    answer = a + b
    return question, answer


def generate_medium():
    choice = random.choice(["AA+B", "A+BB", "AA+BB"])

    match choice:
        case "AA+B":
            a = random.randint(10, 50)
            b = random.randint(1, 10)

        case "A+BB":
            b = random.randint(10, 50)
            a = random.randint(1, 10)

        case "AA+BB":
            a = random.randint(10, 50)
            b = random.randint(10, 10)

    question = f"{a} + {b} ="
    answer = a + b

    return question, answer


def generate_hard():
    choice = random.randint(2, 3)

    if choice == 2:
        a = random.randint(1, 50)
        b = random.randint(1, 10)

        question = f"{a} + {b} ="
        answer = a + b
    else:
        a = random.randint(1, 50)
        b = random.randint(1, 10)
        c = random.randint(1, 10)

        question = f"{a} + {b} + {c} ="
        answer = a + b + c

    return question, answer


def generate_question(level):
    if level == "easy":
        return generate_easy()
    if level == "medium":
        return generate_medium()
    if level == "hard":
        return generate_hard()
