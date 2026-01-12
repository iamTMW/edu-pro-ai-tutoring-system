import random


def generate_sequence(low: int, high: int, seq_length: int):
    # Generate a sequence
    output = [random.randint(low, high) for _ in range(seq_length)]

    # To ensure positive subtraction result, sort descending
    output.sort(reverse=True)

    # Randomly choose one number to hide
    toRemove = random.randint(0, seq_length - 1)
    answer = output[toRemove]

    # Compute total as a chain of subtractions: a - b - c - ...
    total = output[0]
    for i in range(1, seq_length):
        total -= output[i]

    # Build question string
    question = ""
    for i in range(seq_length):
        if i == toRemove:
            question += "__ - "
        else:
            question += f"{output[i]} - "

    # Remove trailing " - " and add total
    question = question[:-3]
    question += f" = {total}"

    return question, answer


def generate_easy():
    return generate_sequence(1, 10, 3)


def generate_medium():
    return generate_sequence(1, 25, 4)


def generate_hard():
    return generate_sequence(1, 50, 4)


def generate_question(level):
    if level == "easy":
        return generate_easy()
    if level == "medium":
        return generate_medium()
    if level == "hard":
        return generate_hard()
