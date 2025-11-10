# Steam Market Price Fetching System

## Overview

Automated system to fetch and store Steam Community Market prices for all CS2 collection items (~960 items excluding graffiti).

## Features

✅ **Automatic Wear Condition Detection**

-   Tries all 5 wear conditions: Battle-Scarred, Well-Worn, Field-Tested, Minimal Wear, Factory New
-   Finds cheapest available variant automatically
-   Stores price under original item name for easy lookup

✅ **Rate Limiting Protection**

-   1.5 second delay between requests
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

### 1. Standalone Script (Recommended for bulk fetch)

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

-   `api/src/services/priceFetcher.js` - Core fetching logic
-   `api/scripts/fetchAllPrices.js` - Standalone execution script
-   `api/src/routes/prices.js` - API endpoints
-   `api/docs/PRICE_FETCHING.md` - This documentation

## Notes

-   Genesis Collection items (The Oligarch, Full Throttle, etc.) may not be tradeable yet
-   Some rare items might not have active listings
-   Prices update in real-time when cache expires (60 minutes default)
-   System automatically finds cheapest variant to save users money
