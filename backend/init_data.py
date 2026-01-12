"""
Initialize backend data files from templates.
Run this once when setting up the project or when you need fresh data.
"""

import os
import shutil
from pathlib import Path

# Get the directory where this script is located
BACKEND_DIR = Path(__file__).parent
USERS_DIR = BACKEND_DIR / "users"

def init_data_files():
    """Copy template files to actual data files if they don't exist."""
    
    print("🔧 Initializing backend data files...")
    
    # Ensure users directory exists
    USERS_DIR.mkdir(exist_ok=True)
    
    # Template files to copy
    templates = {
        'auth_table.template.csv': 'auth_table.csv',
        'classes.template.csv': 'classes.csv',
    }
    
    for template_name, actual_name in templates.items():
        template_path = USERS_DIR / template_name
        actual_path = USERS_DIR / actual_name
        
        # Only copy if actual file doesn't exist
        if not actual_path.exists():
            if template_path.exists():
                shutil.copy(template_path, actual_path)
                print(f"✅ Created {actual_name} from template")
            else:
                print(f"⚠️  Warning: Template {template_name} not found")
        else:
            print(f"ℹ️  {actual_name} already exists, skipping")
    
    # Create .gitkeep to track the directory structure
    gitkeep_path = USERS_DIR / ".gitkeep"
    if not gitkeep_path.exists():
        gitkeep_path.touch()
        print("✅ Created .gitkeep to track directory structure")
    
    print("\n✨ Initialization complete!")
    print("📝 Note: Data files are ignored by git and won't be committed.")

if __name__ == "__main__":
    init_data_files()