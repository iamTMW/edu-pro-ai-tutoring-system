from enum import Enum

class Role(Enum):
    STUDENT = 1
    TEACHER = 2
    PARENT = 3
    BLANK = 4

from pathlib import Path

USERSFOLDER = Path("users")
AUTH_TABLE = USERSFOLDER / "auth_table.csv"
CLASSES_CSV = USERSFOLDER / "classes.csv"
CLASSES_FOLDER = USERSFOLDER / "classes"  # central class templates

QUESTION_GENERATORS = Path(__file__).parent / "QuestionGenerators"
HTML_CONTENT_SRC = QUESTION_GENERATORS / "html_content_files"