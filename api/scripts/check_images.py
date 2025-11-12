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
        SELECT market_hash_name, price, lowest_price, image_url
        FROM prices 
        WHERE market_hash_name LIKE '%AUG | Trigger Discipline%'
        ORDER BY market_hash_name
        LIMIT 10;
    """
    )

    results = cursor.fetchall()

    print("\n📊 Sample Price Data with Images:")
    print("=" * 100)
    for row in results:
        name, price, lowest, image = row
        print(f"\n{name}")
        print(f"  Price: ${price} | Lowest: ${lowest}")
        print(f"  Image: {image or 'No image'}")
    print("=" * 100)

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Query failed: {e}")
