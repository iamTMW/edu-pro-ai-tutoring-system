import random
from ..AddingWithNAmount import AddingWithNAmount
from ..SubtractingWithNAmount import SubtractingWithNAmount


def generate_question(level):
    generator = random.choice([
        AddingWithNAmount.generate_question,
        SubtractingWithNAmount.generate_question
    ])
    return generator(level)
