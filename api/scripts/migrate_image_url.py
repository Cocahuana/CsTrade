import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    # Use same config as price_scraper.py
    DB_CONFIG = {
        "host": os.getenv("DB_HOST", "localhost"),
        "database": os.getenv("DB_NAME", "cstrades"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", ""),
        "port": os.getenv("DB_PORT", "5432"),
    }

    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute(
        """
        ALTER TABLE prices 
        ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);
    """
    )

    conn.commit()
    print("Migration successful: image_url column added to prices table")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Migration failed: {e}")
