"""
CS2 Item Price Scraper
======================

This script scrapes CS2 item prices from the Steam Market and updates the database.

Features:
- Uses Steam Market API via steammarket library
- Respects rate limits (avoid being blocked)
- Supports batch processing
- Extracts exterior/wear from item names
- Updates both Item and Price tables
- Logs progress and errors

Requirements:
- pip install steammarket psycopg2-binary python-dotenv

Usage:
    python price_scraper.py [options]

Options:
    --collection-id <id>  : Only scrape items from specific collection
    --limit <n>          : Limit number of items to scrape
    --currency <code>    : Currency code (default: USD)
    --delay <seconds>    : Delay between requests (default: 2)
    --appid <id>         : Steam AppID (default: 730 for CS2)

References:
- https://pypi.org/project/steammarket/
- https://www.reddit.com/r/csgomarketforum/comments/199yb0l/
- Steam Market API: https://steamcommunity.com/market/priceoverview/
"""

import steammarket as sm
import psycopg2
import time
import json
import argparse
import re
import urllib.parse
import urllib.request
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, List, Tuple
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection parameters
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "cstrades"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
    "port": os.getenv("DB_PORT", "5432"),
}

# Steam Market configuration
STEAM_APPID = 730  # CS2/CS:GO
RATE_LIMIT_DELAY = 2  # seconds between requests

# Exterior mapping
EXTERIORS = {
    "Factory New": "Factory New",
    "Minimal Wear": "Minimal Wear",
    "Field-Tested": "Field-Tested",
    "Well-Worn": "Well-Worn",
    "Battle-Scarred": "Battle-Scarred",
    "Vanilla": "Vanilla",
    "Not Painted": "Not Painted",
}


class PriceScraper:
    """Main scraper class for fetching CS2 item prices"""

    def __init__(self, currency="USD", delay=RATE_LIMIT_DELAY, verbose=True):
        self.currency = currency
        self.delay = delay
        self.verbose = verbose
        self.conn = None
        self.cursor = None
        self.stats = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0,
            "start_time": datetime.now(),
        }

    def connect_db(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            self.cursor = self.conn.cursor()
            if self.verbose:
                print("✅ Database connected")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            raise

    def close_db(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        if self.verbose:
            print("✅ Database connection closed")

    def extract_exterior(self, item_name: str) -> Optional[str]:
        """
        Extract wear/exterior from item name
        Example: "AK-47 | The Oligarch (Factory New)" -> "Factory New"
        """
        # Check for exterior in parentheses
        match = re.search(
            r"\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)",
            item_name,
        )
        if match:
            return match.group(1)

        # Check for Vanilla (knives/gloves)
        if "Vanilla" in item_name:
            return "Vanilla"

        # No exterior (cases, stickers, etc.)
        return "Not Painted"

    def is_stattrak(self, item_name: str) -> bool:
        """
        Check if item is StatTrak™
        Example: "StatTrak™ AK-47 | Redline (Field-Tested)"
        """
        return "StatTrak" in item_name or "StatTrak™" in item_name

    def get_items_to_scrape(
        self, collection_id: Optional[int] = None, limit: Optional[int] = None
    ) -> List[Dict]:
        """
        Fetch items from database that need price updates
        Also generates StatTrak™ variants for applicable items

        Args:
            collection_id: Optional collection ID to filter
            limit: Maximum number of items to fetch

        Returns:
            List of item dictionaries with id, name, and stattrak flag
        """
        query = """
            SELECT i.id, i.name, i.exterior
            FROM items i
            WHERE i.name IS NOT NULL
        """

        params = []

        if collection_id:
            query += """
                AND i.id IN (
                    SELECT ci.item_id 
                    FROM collection_items ci 
                    WHERE ci.collection_id = %s
                )
            """
            params.append(collection_id)

        query += " ORDER BY i.id"

        if limit:
            query += f" LIMIT {limit}"

        self.cursor.execute(query, params)
        results = self.cursor.fetchall()

        items = []

        # Weapon skin exteriors (in order from best to worst)
        skin_exteriors = [
            "Factory New",
            "Minimal Wear",
            "Field-Tested",
            "Well-Worn",
            "Battle-Scarred",
        ]

        for row in results:
            item_id = row[0]
            base_name = row[1]

            # Check if this is a weapon skin (has | separator and no exterior yet)
            is_weapon_skin = "|" in base_name and "(" not in base_name

            # Exclude items that shouldn't have exteriors
            is_case = "Case" in base_name and "|" not in base_name
            is_sticker = base_name.startswith("Sticker |")
            is_patch = base_name.startswith("Patch |")
            is_pin = "Pin" in base_name
            is_graffiti = "Graffiti |" in base_name or "Sealed Graffiti" in base_name
            is_key = "Key" in base_name
            is_pass = "Pass" in base_name or "Coin" in base_name
            is_music_kit = "Music Kit" in base_name

            should_skip = (
                is_case
                or is_sticker
                or is_patch
                or is_pin
                or is_graffiti
                or is_key
                or is_pass
                or is_music_kit
            )

            if is_weapon_skin and not should_skip:
                # Generate all 5 exterior variants for weapon skins
                for exterior in skin_exteriors:
                    full_name = f"{base_name} ({exterior})"

                    # Add normal version
                    items.append(
                        {
                            "id": item_id,
                            "name": full_name,
                            "base_name": base_name,
                            "exterior": exterior,
                            "is_stattrak": False,
                        }
                    )

                    # Add StatTrak™ version
                    stattrak_name = f"StatTrak™ {full_name}"
                    items.append(
                        {
                            "id": item_id,
                            "name": stattrak_name,
                            "base_name": base_name,
                            "exterior": exterior,
                            "is_stattrak": True,
                        }
                    )
            else:
                # For non-skins (cases, stickers, etc.), just add the base item
                items.append(
                    {
                        "id": item_id,
                        "name": base_name,
                        "base_name": base_name,
                        "exterior": "Not Painted",
                        "is_stattrak": False,
                    }
                )

        return items

    def fetch_price(self, item_name: str) -> Optional[Dict]:
        """
        Fetch price from Steam Market using steammarket library
        Returns lowest, median, and volume data

        Args:
            item_name: Exact market hash name of item

        Returns:
            Price data dict with lowest_price, median_price, volume or None if failed
        """
        try:
            # Use steammarket library to fetch data (USD currency)
            result = sm.get_csgo_item(item_name, currency=self.currency)

            if result.get("success"):
                return {
                    "success": True,
                    "lowest_price": result.get(
                        "lowest_price"
                    ),  # Current lowest listing
                    "median_price": result.get("median_price"),  # Average/median price
                    "volume": result.get("volume"),  # 24h volume
                    "currency": self.currency,
                }
            else:
                return {"success": False, "error": "Item not found on market"}

        except Exception as e:
            return {"success": False, "error": str(e)}

    def parse_price_string(self, price_str: str) -> Optional[Decimal]:
        """
        Parse price string from Steam Market to decimal
        Examples: "$1.23", "1,23€", "£0.99"

        Args:
            price_str: Price string from Steam API

        Returns:
            Decimal price or None if parsing fails
        """
        if not price_str:
            return None

        try:
            # Remove currency symbols and convert comma to dot
            cleaned = re.sub(r"[^\d,.]", "", price_str)
            cleaned = cleaned.replace(",", ".")
            return Decimal(cleaned)
        except:
            return None

    def fetch_image_url(self, item_name: str) -> Optional[str]:
        """
        Fetch image URL from Steam Market API

        Args:
            item_name: Exact market hash name of item

        Returns:
            Image URL string or None if failed
        """
        try:
            # URL encode the item name
            encoded_name = urllib.parse.quote(item_name)

            # Steam Market listings API endpoint
            url = f"https://steamcommunity.com/market/listings/730/{encoded_name}/render/?start=0&count=1&currency=1"

            # Add headers to mimic browser request
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }

            req = urllib.request.Request(url, headers=headers)

            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode("utf-8"))

                # Extract image URL from the first listing
                if data.get("success") and data.get("assets"):
                    # Get the first asset
                    app_data = data["assets"].get("730", {})
                    if app_data:
                        # Get first context ID
                        context_data = list(app_data.values())[0] if app_data else {}
                        if context_data:
                            # Get first asset
                            asset = (
                                list(context_data.values())[0] if context_data else {}
                            )
                            icon_url = asset.get("icon_url")

                            if icon_url:
                                # Construct full CDN URL
                                return f"https://community.cloudflare.steamstatic.com/economy/image/{icon_url}"

                return None

        except Exception as e:
            print(f"    ⚠️  Failed to fetch image URL: {str(e)}")
            return None

    def update_item_price(
        self,
        item_id: int,
        item_name: str,
        price_data: Dict,
        exterior: Optional[str] = None,
        is_stattrak: bool = False,
    ):
        """
        Update item and price tables with fetched data
        Stores both normal and StatTrak™ prices separately

        Args:
            item_id: Item database ID
            item_name: Item name (may include StatTrak™)
            price_data: Parsed price data from Steam (lowest, median, volume)
            exterior: Item exterior/wear
            is_stattrak: Whether this is a StatTrak™ variant
        """
        try:
            lowest_price = self.parse_price_string(price_data.get("lowest_price"))
            median_price = self.parse_price_string(price_data.get("median_price"))

            # Use lowest price as main price (what buyers actually pay)
            # Fallback to median if lowest not available
            main_price = lowest_price or median_price

            if not main_price:
                if self.verbose:
                    print(f"  ⚠️ No valid price for {item_name}")
                self.stats["skipped"] += 1
                return

            # Fetch image URL from Steam Market
            image_url = self.fetch_image_url(item_name)

            # Update or insert into prices table using market_hash_name as key
            # This allows storing different prices for each exterior and StatTrak variant
            self.cursor.execute(
                """
                INSERT INTO prices (id, market_hash_name, price, lowest_price, median_price, exterior, image_url, source, updated_at, created_at)
                VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, 'steam', NOW(), NOW())
                ON CONFLICT (market_hash_name) 
                DO UPDATE SET
                    price = EXCLUDED.price,
                    lowest_price = EXCLUDED.lowest_price,
                    median_price = EXCLUDED.median_price,
                    exterior = EXCLUDED.exterior,
                    image_url = EXCLUDED.image_url,
                    source = EXCLUDED.source,
                    updated_at = NOW()
            """,
                (
                    item_name,  # Full name with exterior
                    str(main_price),
                    str(lowest_price) if lowest_price else None,
                    str(median_price) if median_price else None,
                    exterior,
                    image_url,
                ),
            )

            self.conn.commit()
            self.stats["success"] += 1

            stattrak_label = " [StatTrak™]" if is_stattrak else ""
            if self.verbose:
                prices_str = f"Lowest: ${lowest_price}, Median: ${median_price}, Main: ${main_price}"
                print(f"  ✅ {item_name}{stattrak_label}")
                print(f"     {prices_str} ({exterior or 'N/A'})")

        except Exception as e:
            self.conn.rollback()
            self.stats["failed"] += 1
            print(f"  ❌ Database update failed for {item_name}: {e}")

    def scrape_items(self, items: List[Dict]):
        """
        Scrape prices for a list of items (including StatTrak variants)

        Args:
            items: List of item dictionaries from database
        """
        total = len(items)

        if self.verbose:
            print(
                f"\n🔄 Starting to scrape {total} items (including StatTrak variants)..."
            )
            print(f"⏱️ Estimated time: ~{total * self.delay / 60:.1f} minutes\n")

        for idx, item in enumerate(items, 1):
            item_id = item["id"]
            item_name = item["name"]
            exterior = item["exterior"] or self.extract_exterior(item_name)
            is_stattrak = item.get("is_stattrak", False)

            self.stats["total"] += 1

            if self.verbose:
                stattrak_label = " [StatTrak™]" if is_stattrak else ""
                print(f"[{idx}/{total}] Fetching: {item_name}{stattrak_label}")

            # Fetch price from Steam Market
            price_data = self.fetch_price(item_name)

            if price_data.get("success"):
                self.update_item_price(
                    item_id, item_name, price_data, exterior, is_stattrak
                )
            else:
                self.stats["failed"] += 1
                error = price_data.get("error", "Unknown error")
                if self.verbose:
                    print(f"  ❌ Failed: {error}")

            # Rate limiting - wait between requests
            if idx < total:  # Don't wait after last item
                time.sleep(self.delay)

    def print_stats(self):
        """Print scraping statistics"""
        duration = (datetime.now() - self.stats["start_time"]).total_seconds()

        print("\n" + "=" * 60)
        print("📊 SCRAPING STATISTICS")
        print("=" * 60)
        print(f"Total items:     {self.stats['total']}")
        print(f"✅ Success:      {self.stats['success']}")
        print(f"❌ Failed:       {self.stats['failed']}")
        print(f"⏭️  Skipped:      {self.stats['skipped']}")
        print(f"⏱️  Duration:     {duration:.1f}s ({duration/60:.1f}m)")
        if self.stats["total"] > 0:
            print(
                f"📈 Success rate: {(self.stats['success']/self.stats['total']*100):.1f}%"
            )
        print("=" * 60 + "\n")

    def run(self, collection_id: Optional[int] = None, limit: Optional[int] = None):
        """
        Main execution method

        Args:
            collection_id: Optional collection to filter
            limit: Maximum items to scrape
        """
        try:
            # Connect to database
            self.connect_db()

            # Get items to scrape
            items = self.get_items_to_scrape(collection_id, limit)

            if not items:
                print("⚠️ No items found to scrape")
                return

            # Scrape prices
            self.scrape_items(items)

            # Print statistics
            self.print_stats()

        except KeyboardInterrupt:
            print("\n\n⚠️ Scraping interrupted by user")
            self.print_stats()
        except Exception as e:
            print(f"\n❌ Fatal error: {e}")
            raise
        finally:
            # Always close database connection
            self.close_db()


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Scrape CS2 item prices from Steam Market",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scrape all items
  python price_scraper.py
  
  # Scrape specific collection
  python price_scraper.py --collection-id 5
  
  # Scrape first 100 items only
  python price_scraper.py --limit 100
  
  # Use EUR currency with 3 second delay
  python price_scraper.py --currency EUR --delay 3
        """,
    )

    parser.add_argument(
        "--collection-id", type=int, help="Only scrape items from this collection"
    )
    parser.add_argument("--limit", type=int, help="Maximum number of items to scrape")
    parser.add_argument(
        "--currency", default="USD", help="Currency code (USD, EUR, GBP, etc.)"
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=RATE_LIMIT_DELAY,
        help="Delay between requests in seconds",
    )
    parser.add_argument("--quiet", action="store_true", help="Suppress verbose output")

    args = parser.parse_args()

    # Create and run scraper
    scraper = PriceScraper(
        currency=args.currency, delay=args.delay, verbose=not args.quiet
    )

    scraper.run(collection_id=args.collection_id, limit=args.limit)


if __name__ == "__main__":
    main()
