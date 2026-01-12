import random


def generate_sequence(low: int, high: int, seq_length: int):
    output = [random.randint(low, high) for _ in range(seq_length)]
    toRemove = random.randint(0, seq_length - 1)
    answer = output[toRemove]

    total_sum = sum(output)  # total sum of the sequence
    question = ""
    for i in range(seq_length):
        if i == toRemove:
            question += "__ + "
        else:
            question += f"{output[i]} + "

    # remove trailing " + " and add total sum
    question = question[:-3]
    question += f" = {total_sum}"

    return question, answer


def generate_easy():
    return generate_sequence(0, 10, 3)


def generate_medium():
    return generate_sequence(0, 25, 4)


def generate_hard():
    return generate_sequence(0, 50, 4)


def generate_question(level):
    if level == "easy":
        return generate_easy()
    if level == "medium":
        return generate_medium()
    if level == "hard":
        return generate_hard()
