import random
from ..AddingWithBlanks import AddingWithBlanks
from ..SubtractingWithBlanks import SubtractingWithBlanks

def generate_question(level):
    generator = random.choice([
        AddingWithBlanks.generate_question,
        SubtractingWithBlanks.generate_question
    ])
    return generator(level)
