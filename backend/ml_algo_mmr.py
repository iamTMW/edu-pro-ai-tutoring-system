from sklearn.preprocessing import MinMaxScaler
from sklearn.decomposition import PCA
import numpy as np
import re


def extract_math_features(q_content: str):
    numbers = [int(n) for n in re.findall(r"-?\d+", q_content)]

    if len(numbers) == 0:
        numbers = [0]

    even_count = 0
    odd_count = 0
    for n in numbers:
        if n % 2 == 0:
            even_count += 1
        else:
            odd_count += 1

    sum_numbers = sum(numbers)
    max_number = max(numbers)
    min_number = min(numbers)
    has_blank = 1 if "_" in q_content else 0

    factor_flag = 0
    for i in range(len(numbers)):
        for j in range(len(numbers)):
            if i != j and numbers[i] != 0 and numbers[j] % numbers[i] == 0:
                factor_flag = 1
                break

    plus_count = q_content.count("+")
    minus_count = q_content.count("-")
    times_count = q_content.count("*")
    div_count = q_content.count("/")
    pow_count = q_content.count("^")

    return [
        len(q_content),
        sum_numbers,
        max_number,
        min_number,
        len(numbers),
        even_count,
        odd_count,
        has_blank,
        factor_flag,
        plus_count,
        minus_count,
        times_count,
        div_count,
        pow_count
    ]


def assign_mmr_for_lesson(lesson_questions):
    """
    Beginner-friendly MMR assignment.
    lesson_questions: dict of level -> list of questions
    Returns: dict {question_id: mmr}
    """
    all_features = []
    all_ids = []
    question_level_map = {}

    # Collect features and track which question belongs to which level
    for level in lesson_questions:
        questions = lesson_questions[level]
        for q in questions:
            features = extract_math_features(q["content"])
            all_features.append(features)
            all_ids.append(q["id"])
            question_level_map[q["id"]] = level

    if len(all_features) == 0:
        return {}

    X = np.array(all_features, dtype=float)
    pca = PCA(n_components=1)
    X_pca = pca.fit_transform(X).flatten()

    elo_scores = {}
    level_ranges = {
        "easy": (800, 1200),
        "medium": (1200, 1600),
        "hard": (1600, 2000)
    }

    # Assign Elo per level
    for level in level_ranges:
        if level not in lesson_questions:
            continue  # skip levels that don't exist

        # Get indices for this level
        level_indices = []
        for i, qid in enumerate(all_ids):
            if question_level_map[qid] == level:
                level_indices.append(i)

        if len(level_indices) == 0:
            continue

        # Scale PCA to Elo range
        level_values = X_pca[level_indices].reshape(-1, 1)
        scaler = MinMaxScaler(feature_range=level_ranges[level])
        scaled = scaler.fit_transform(level_values).flatten()

        # Assign scaled score
        for i, idx in enumerate(level_indices):
            elo_scores[all_ids[idx]] = float(scaled[i])

    return elo_scores
