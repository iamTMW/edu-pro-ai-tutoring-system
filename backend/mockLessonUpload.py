import json
import os

# Your data
template = {
    "lesson_001": [
        {"id": "q1", "level": "easy", "content": "Question 1 content", "solution": "2",
         "hints": ["Think about adding small numbers first"], "solution_feedback": "The answer is 2"},
        {"id": "q2", "level": "easy", "content": "Question 2 content", "solution": "5",
         "hints": ["Consider multiplication"], "solution_feedback": "The answer is 5"}
    ],
    "lesson_002": [
        {"id": "q3", "level": "medium", "content": "Question 3 content", "solution": "144",
         "hints": ["Think about squares"], "solution_feedback": "The answer is 144"}
    ],
    "lesson_003": [
        {"id": "q4", "level": "easy", "content": "Question 4 content", "solution": "10",
         "hints": ["Add all numbers"], "solution_feedback": "The answer is 10"}
    ]
}

html_lessons = {
    "lesson_001": "<div>Lesson 1 content</div>",
    "lesson_002": "<div>Lesson 2 content</div>",
    "lesson_003": "<div>Lesson 3 content</div>"
}

# Create output folder if it doesn't exist
output_folder = "output_lessons"
os.makedirs(output_folder, exist_ok=True)

# Save all lessons JSON in a single file
all_lessons_file = os.path.join(output_folder, "all_lessons.json")
with open(all_lessons_file, "w", encoding="utf-8") as f:
    json.dump(template, f, indent=4)

# Save HTML files separately
for lesson_id, html_content in html_lessons.items():
    html_file_path = os.path.join(output_folder, f"{lesson_id}.html")
    with open(html_file_path, "w", encoding="utf-8") as f:
        f.write(html_content)

print(f"Saved all lessons JSON as '{all_lessons_file}'")
print(f"Saved {len(html_lessons)} HTML files in '{output_folder}'")
