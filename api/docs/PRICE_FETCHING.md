# Steam Market Price Fetching System

## Overview

Automated system to fetch and store Steam Community Market prices for all CS2 collection items (~960 items excluding graffiti).

**Two Approaches Available:**

1. **Collection-Based Fetching** (NEW - RECOMMENDED) - Uses Steam Market search by collection tags
2. **Individual Item Fetching** - Fetches prices for specific items with wear condition detection

## Features

### Collection-Based Approach ✨ NEW

✅ **Efficient Collection Tag Search**

-   Fetches all items from a collection at once using Steam Market search
-   Supports 90+ collections with comprehensive tag mapping
-   Automatic pagination (100 items per page)
-   Handles both HTML and JSON API responses

✅ **Smart Tag Resolution**

-   Pre-mapped tags for all major collections (2013-2025)
-   Automatic tag guessing for unmapped collections
-   Pattern recognition for operation, map, and numbered collections

✅ **Comprehensive Data Extraction**

-   Item names and prices
-   Exterior/wear conditions
-   Image URLs from Steam CDN
-   Volume and pricing statistics

### Individual Item Approach

✅ **Automatic Wear Condition Detection**

-   Tries all 5 wear conditions: Battle-Scarred, Well-Worn, Field-Tested, Minimal Wear, Factory New
-   Finds cheapest available variant automatically
-   Stores price under original item name for easy lookup

✅ **Rate Limiting Protection**

-   1.5-3 second delay between requests
-   Automatic retry on rate limits (max 3 retries)
-   Configurable retry delays

✅ **Database Caching**

-   Prices stored in PostgreSQL
-   Automatic timestamp tracking
-   Skip already-fetched items option

✅ **Graffiti Filtering**

-   Automatically excludes graffiti items
-   Reduces total items from 969 → 960

## Usage

### NEW: Collection-Based Price Fetching (RECOMMENDED) 🚀

**Script Location:** `src/scripts/updatePrices.js`

```bash
# Update prices for a specific collection
node src/scripts/updatePrices.js --collection="The Genesis Collection"
node src/scripts/updatePrices.js --collection="The 2018 Inferno Collection"

# Update prices for ALL collections in database
node src/scripts/updatePrices.js
```

**Features:**

-   ✅ Fetches all items from a collection in one request
-   ✅ Automatic pagination for large collections
-   ✅ Updates both Price and Item models
-   ✅ Extracts and stores image URLs
-   ✅ Rate-limited (3s between pages/collections)
-   ✅ Comprehensive logging with progress indicators

**Estimated Time:**

-   Single collection: 3-9 seconds (depending on size)
-   All collections: ~10 minutes (~100 collections × ~6s average)

**Collection Tag Mapping:**
See `src/data/collectionTags.js` for 90+ pre-mapped collections. Unmapped collections will use automatic tag guessing.

**Example Output:**

```
✅ Database connected.

📦 Fetching prices for collection: The Genesis Collection
   🏷️  Using tag: tag_set_op14_genesis
   📄 Fetching page starting at 0...
   🔍 Found 15 items on this page (HTML)
   ✅ Finished. Updated 15 items.

✅ Price update complete.
```

---

### Alternative: Individual Item Fetching

**Script Location:** `scripts/fetchAllPrices.js`

```bash
# Fetch all prices (will take ~25 minutes for 960 items)
node scripts/fetchAllPrices.js

# Test with limited items first
node scripts/fetchAllPrices.js --limit 10

# Update existing price records
node scripts/fetchAllPrices.js --update-existing

# Include graffiti items
node scripts/fetchAllPrices.js --skip-graffiti=false
```

**Estimated Time:** ~25-30 minutes for all items (1.5s per item × 960 items)

### 2. API Endpoints

#### Fetch All Prices

```bash
POST http://localhost:5000/api/prices/fetch-all?limit=10
```

Query parameters:

-   `skipGraffiti`: boolean (default: true)
-   `updateExisting`: boolean (default: false)
-   `limit`: number (for testing)

Response:

```json
{
	"success": true,
	"message": "Price fetch completed",
	"stats": {
		"total": 969,
		"processed": 960,
		"success": 950,
		"failed": 0,
		"notAvailable": 10,
		"skipped": 0,
		"duration": "25.3m"
	}
}
```

#### Update Specific Items

```bash
POST http://localhost:5000/api/prices/update
Content-Type: application/json

{
  "items": [
    "AK-47 | Redline",
    "AWP | Asiimov",
    "M4A4 | Howl"
  ]
}
```

Response:

```json
{
	"success": true,
	"message": "Updated 3 items",
	"stats": {
		"total": 3,
		"success": 3,
		"failed": 0,
		"notAvailable": 0
	}
}
```

## How It Works

### Wear Condition Fallback System

For each item (e.g., "AK-47 | Redline"):

1. Try "AK-47 | Redline (Battle-Scarred)" - cheapest wear
2. If not found, try "AK-47 | Redline (Well-Worn)"
3. If not found, try "AK-47 | Redline (Field-Tested)"
4. Continue through all wear conditions
5. If none found, try exact name (for items without wear)
6. If still not found, store with $0 price

### Example Output

```
[1/960] 📥 Fetching: AK-47 | Aquamarine Revenge
[1/960]   ✅ $41.57 (Low: $43.17, Med: $41.57 [AK-47 | Aquamarine Revenge (Battle-Scarred)])

[2/960] 📥 Fetching: AK-47 | The Oligarch
[2/960]   ⚠️  Not found on market

[3/960] 📥 Fetching: AWP | Asiimov
[3/960]   ✅ $62.34 (Low: $64.12, Med: $62.34 [AWP | Asiimov (Field-Tested)])
```

## Database Schema

Prices are stored in the `prices` table:

```sql
CREATE TABLE prices (
  id UUID PRIMARY KEY,
  market_hash_name VARCHAR UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  lowest_price DECIMAL(10,2),
  median_price DECIMAL(10,2),
  volume INTEGER,
  source ENUM('steam', 'skinport', 'manual'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Price Fields Explained

-   **price**: Main price (median if available, otherwise lowest)
-   **lowest_price**: Cheapest available on market
-   **median_price**: Median sale price
-   **volume**: Number of listings
-   **source**: Always 'steam' for automated fetches

## Rate Limiting

Steam Market API limits:

-   ~1 request per second safe
-   429 errors trigger automatic retry
-   Max 3 retries with 5-second delays

Our configuration:

-   1.5 second delay between requests
-   Well within rate limits
-   Handles ~960 items in 25 minutes

## Error Handling

### Not Available on Market

-   Items marked with $0 price
-   Still creates database record
-   Can be updated later when available

### Rate Limited (429)

-   Automatically waits 5 seconds
-   Retries up to 3 times
-   Continues to next item if all retries fail

### Network Errors

-   Retries up to 3 times
-   Logs error details
-   Continues processing remaining items

## Monitoring Progress

The script provides detailed progress:

```
════════════════════════════════════════════════════════════
PRICE FETCH COMPLETE
════════════════════════════════════════════════════════════
Total items in DB: 969
Processed: 960
Success: 950
Not available: 10
Failed: 0
Skipped (existing): 0
Duration: 25.3 minutes
════════════════════════════════════════════════════════════
```

## Recommended Workflow

### Initial Setup (First Time)

```bash
# 1. Test with small sample
node scripts/fetchAllPrices.js --limit 10

# 2. If successful, fetch all prices (grab coffee ☕)
node scripts/fetchAllPrices.js
```

### Regular Updates

```bash
# Update only existing records
node scripts/fetchAllPrices.js --update-existing

# Or use API endpoint for specific items
curl -X POST http://localhost:5000/api/prices/update \
  -H "Content-Type: application/json" \
  -d '{"items": ["AK-47 | Redline", "AWP | Asiimov"]}'
```

## Integration with Collections

Prices are stored using the original item name from collections:

```javascript
// Get item from collection
const item = "AK-47 | Aquamarine Revenge";

// Query price (automatically uses cheapest wear variant)
const price = await Price.findOne({
	where: { marketHashName: item },
});

console.log(price.price); // $41.57 (Battle-Scarred variant)
```

## Files

### Collection-Based System (NEW)

-   `api/src/data/collectionTags.js` - Collection name to Steam tag mapping (90+ collections)
-   `api/src/services/collectionPriceFetcher.js` - Collection-based price fetching service
-   `api/src/scripts/updatePrices.js` - CLI script for collection price updates

### Individual Item System

-   `api/src/services/priceFetcher.js` - Core individual item fetching logic
-   `api/scripts/fetchAllPrices.js` - Standalone execution script
-   `api/src/routes/prices.js` - API endpoints
-   `api/docs/PRICE_FETCHING.md` - This documentation

## Collection-Based System Details

### Components Architecture

#### 1. Collection Tag Mapping (`src/data/collectionTags.js`)

Maintains a comprehensive mapping of collection names to Steam Market search tags:

```javascript
export const COLLECTION_TAGS = {
	"The Genesis Collection": "tag_set_op14_genesis",
	"The 2018 Inferno Collection": "tag_set_inferno_2",
	// ... 90+ more collections
};

// Automatic tag guessing for unmapped collections
export function getCollectionTag(collectionName) {
	// Returns mapped tag or generates best guess
}
```

**Coverage:**

-   ✅ Recent Operations (2024-2025): Genesis, Fever, Safari Mesh, Kilowatt, Gallery
-   ✅ 2022-2023 Operations: Revolution, Anubis, Recoil, Dreams & Nightmares, Riptide
-   ✅ Classic Map Collections: Dust 2, Mirage, Inferno, Nuke, Cache, Train, etc.
-   ✅ Historical Collections: Alpha, Bravo, Chroma series, Gamma series, Spectrum, etc.
-   ✅ Annual Updates: 2018 Inferno, 2018 Nuke, 2021 collections

#### 2. Price Fetcher Service (`src/services/collectionPriceFetcher.js`)

**Main Function:** `fetchCollectionPrices(collectionName)`

```javascript
import { fetchCollectionPrices } from "../services/collectionPriceFetcher.js";

// Fetch prices for one collection
await fetchCollectionPrices("The Genesis Collection");
```

**Process Flow:**

1. Resolves collection name to Steam tag
2. Constructs Steam Market search URL with tag filter
3. Fetches paginated results (100 items per page)
4. Parses HTML/JSON responses using cheerio
5. Extracts: name, price, exterior, image URL
6. Updates database (Price and Item models)
7. Returns statistics

**Features:**

-   Automatic pagination handling
-   Rate limiting (3s between pages)
-   Dual response format support (HTML + JSON)
-   Exterior detection from item names
-   Image URL extraction and storage
-   Comprehensive error handling

**Helper Function:** `fetchAllCollectionsPrices()`

```javascript
// Fetch prices for all collections in database
await fetchAllCollectionsPrices();
```

#### 3. Update Script (`src/scripts/updatePrices.js`)

Command-line interface for price updates:

```bash
# Single collection
node src/scripts/updatePrices.js --collection="The Genesis Collection"

# All collections
node src/scripts/updatePrices.js
```

### Steam Market API Details

**Endpoint Format:**

```
https://steamcommunity.com/market/search/render/
  ?query=
  &start=0
  &count=100
  &search_descriptions=0
  &sort_column=default
  &sort_dir=desc
  &appid=730
  &category_730_ItemSet[]=tag_set_op14_genesis
  &norender=1
```

**Parameters:**

-   `appid=730`: CS2/CS:GO app ID
-   `category_730_ItemSet[]`: Collection tag filter
-   `start`: Pagination offset
-   `count`: Items per page (max 100)
-   `norender=1`: Return JSON response

### Adding New Collections

When new collections are released:

1. **Find the Steam Tag:**

    - Visit Steam Market
    - Search for the collection
    - Check URL for `category_730_ItemSet%5B%5D=tag_set_XXXXX`

2. **Add to Mapping:**

    ```javascript
    // In src/data/collectionTags.js
    export const COLLECTION_TAGS = {
    	// ... existing mappings
    	"The New Collection Name": "tag_set_new_tag",
    };
    ```

3. **Run Update:**
    ```bash
    node src/scripts/updatePrices.js --collection="The New Collection Name"
    ```

If you skip step 2, the system will attempt to guess the tag automatically.

### Troubleshooting

**Issue: "Collection tag not found" warning**

-   System is using automatic tag guessing
-   Add explicit mapping to `COLLECTION_TAGS` for better accuracy

**Issue: No items returned**

-   Verify tag on Steam Market website
-   Check if collection is available for trading
-   Some new collections may not be immediately available

**Issue: Rate limiting errors (429)**

-   Increase `DELAY_BETWEEN_PAGES` in `collectionPriceFetcher.js`
-   Default is 3 seconds, can increase to 5-10 seconds if needed

**Issue: Incorrect prices**

-   Verify correct collection name (case-sensitive)
-   Check Steam Market manually to confirm prices
-   Re-run update after a few minutes

### Performance Comparison

| Method           | Items           | Time    | Efficiency |
| ---------------- | --------------- | ------- | ---------- |
| Collection-Based | All collections | ~10 min | ⚡ Fast    |
| Individual Items | 960 items       | ~25 min | 🐌 Slow    |

**Collection-Based Advantages:**

-   ✅ 60% faster for bulk updates
-   ✅ One request fetches entire collection
-   ✅ Automatic image URL extraction
-   ✅ Better for regular updates
-   ✅ Handles new items automatically

**When to Use Individual Method:**

-   Need specific items only
-   Want to update specific wear conditions
-   Collection not available on Steam Market

## Notes

-   Genesis Collection items (The Oligarch, Full Throttle, etc.) may not be tradeable yet
-   Some rare items might not have active listings
-   Prices update in real-time when cache expires (60 minutes default)
-   System automatically finds cheapest variant to save users money
-   Collection-based fetching is 60% faster than individual item fetching
