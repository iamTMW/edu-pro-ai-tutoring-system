import random
from ..Adding import Adding
from ..Subtracting import Subtracting

def generate_question(level):
    generator = random.choice([
        Adding.generate_question,
        Subtracting.generate_question
    ])
    return generator(level)
