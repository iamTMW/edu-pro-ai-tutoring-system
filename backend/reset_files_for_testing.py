import os
import shutil
from pathlib import Path
import csv

# Paths
BASE = Path("users")
CLASSES_FOLDER = BASE / "classes"
AUTH_TABLE = BASE / "auth_table.csv"
CLASSES_CSV = BASE / "classes.csv"

"""
GPT script to quickly clear local db to start from scratch
"""


def clear_folder_contents(folder: Path):
    """Delete everything inside a folder but keep the folder itself."""
    if not folder.exists():
        print(f"[!] Folder not found: {folder}")
        return
    for item in folder.iterdir():
        if item.is_file():
            item.unlink()
        elif item.is_dir():
            shutil.rmtree(item)
    print(f"[✓] Cleared contents of {folder}")


def clear_csv_keep_header(csv_path: Path):
    """Keep header row, delete all data rows."""
    if not csv_path.exists():
        print(f"[!] File not found: {csv_path}")
        return

    with open(csv_path, newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)
        if not rows:
            print(f"[!] No headers found in {csv_path}")
            return
        header = rows[0]

    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)

    print(f"[✓] Cleared {csv_path}, kept headers")


def delete_other_folders(base: Path, exclude: list):
    """Delete all folders inside base except those in exclude list."""
    for item in base.iterdir():
        if item.is_dir() and item.name not in exclude:
            shutil.rmtree(item)
            print(f"[✓] Deleted folder: {item}")
    print(f"[✓] Removed all folders except {exclude}")


def main():
    print("=== RESETTING SYSTEM DATA ===")

    # 1️⃣ Clear everything inside users/classes but keep the folder
    clear_folder_contents(CLASSES_FOLDER)

    # 2️⃣ Clear auth_table.csv but keep headers
    clear_csv_keep_header(AUTH_TABLE)

    # 3️⃣ Clear classes.csv but keep headers
    clear_csv_keep_header(CLASSES_CSV)

    # 4️⃣ Delete all other folders inside users/
    delete_other_folders(BASE, exclude=["classes"])

    print("\n=== RESET COMPLETE ===")


if __name__ == "__main__":
    main()
