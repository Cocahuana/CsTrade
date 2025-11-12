# House Profit/Loss Tracking System

## Overview

The system now tracks how much the house wins or loses on each case opening. This is calculated as:

```
houseProfitCredits = creditsSpent - itemValueCredits
```

-   **Positive value** = House won money (item was worth less than case price)
-   **Negative value** = House lost money (item was worth more than case price)

## Database Changes

### CaseOpening Model

Added `houseProfitCredits` field:

-   Type: INTEGER
-   Nullable: NO
-   Comment: "House profit/loss: creditsSpent - itemValueCredits (positive = house won, negative = house lost)"

### Migration

File: `20251110-add-house-profit-to-case-openings.js`

-   Adds the `house_profit_credits` column
-   Backfills existing records with calculated values
-   Sets column to NOT NULL after backfill

## Service Updates

### caseOpeningService.js

The `openCase()` function now:

1. Calculates `houseProfitCredits = customCase.priceCredits - itemValueCredits`
2. Stores this value in the CaseOpening record

Example:

```javascript
// Case costs 500 credits
// User wins item worth 200 credits
// House profit = 500 - 200 = 300 credits (house won)

// Case costs 500 credits
// User wins item worth 800 credits
// House profit = 500 - 800 = -300 credits (house lost)
```

## Analytics API

### Endpoints

#### 1. GET /api/analytics/house-profit

Get overall house profit/loss statistics.

**Query Parameters:**

-   `period`: "24h" | "7d" | "30d" | "all" (default: "all")
-   `caseId`: UUID (optional - filter by specific case)
-   `groupBy`: "day" | "case" | "none" (default: "none")

**Example Request:**

```bash
GET /api/analytics/house-profit?period=7d&groupBy=case
```

**Example Response:**

```json
{
	"success": true,
	"period": "7d",
	"data": {
		"totalProfit": 45000,
		"avgProfit": 125.5,
		"totalOpenings": 358,
		"totalRevenue": 179000,
		"totalPaidOut": 134000,
		"profitableOpenings": 320,
		"unprofitableOpenings": 38,
		"profitMargin": "25.14",
		"breakdown": [
			{
				"caseId": "uuid-here",
				"profit": 12000,
				"openings": 150,
				"case": {
					"title": "Dragon Lore Case",
					"priceCredits": 500
				}
			}
		]
	}
}
```

#### 2. GET /api/analytics/top-profitable-cases

Get cases ranked by profitability.

**Query Parameters:**

-   `limit`: number (default: 10)
-   `order`: "profit" | "margin" | "openings" (default: "profit")

**Example Request:**

```bash
GET /api/analytics/top-profitable-cases?limit=5&order=margin
```

**Example Response:**

```json
{
	"success": true,
	"data": [
		{
			"caseId": "uuid",
			"totalProfit": 25000,
			"totalOpenings": 200,
			"totalRevenue": 100000,
			"profitMargin": 25.0,
			"case": {
				"title": "Budget Case",
				"imageUrl": "...",
				"priceCredits": 500
			}
		}
	]
}
```

#### 3. GET /api/analytics/recent-big-wins

Get recent openings where the house lost significantly (users won big items).

**Query Parameters:**

-   `limit`: number (default: 20)
-   `minLoss`: number (default: 0) - minimum house loss in credits

**Example Request:**

```bash
GET /api/analytics/recent-big-wins?limit=10&minLoss=1000
```

**Example Response:**

```json
{
	"success": true,
	"data": [
		{
			"id": "opening-uuid",
			"houseProfitCredits": -4500,
			"creditsSpent": 500,
			"itemValueCredits": 5000,
			"openedAt": "2025-11-10T10:30:00Z",
			"case": {
				"title": "Dragon Lore Case",
				"imageUrl": "...",
				"priceCredits": 500
			},
			"user": {
				"username": "ProGamer123",
				"steamId": "76561198..."
			},
			"itemWon": {
				"name": "AWP | Dragon Lore (Factory New)",
				"price": {
					"price": "50.00"
				}
			}
		}
	]
}
```

## Use Cases

### 1. Dashboard Metrics

Display overall house performance:

-   Total profit this month
-   Profit margin percentage
-   Win/loss ratio

### 2. Case Analysis

Identify which cases are:

-   Most profitable for the house
-   Too generous (losing money)
-   Need probability adjustments

### 3. Player Highlights

Showcase big wins on the platform:

-   Recent jackpots where players won expensive items
-   Creates excitement and engagement

### 4. Economic Balance

Monitor the platform economy:

-   Ensure sustainable house edge
-   Detect cases that need rebalancing
-   Track if expected value matches actual results

## Example Queries

### Get today's profit

```bash
GET /api/analytics/house-profit?period=24h
```

### Find which cases are losing money

```bash
GET /api/analytics/top-profitable-cases?order=profit&limit=100
# Filter results where totalProfit < 0
```

### Show recent big wins on homepage

```bash
GET /api/analytics/recent-big-wins?limit=5&minLoss=500
```

### Daily profit breakdown for charts

```bash
GET /api/analytics/house-profit?period=30d&groupBy=day
```

## Notes

-   All values are in **credits** (100 credits = $1 USD)
-   House profit includes fees distributed to platform/creator
-   Negative profit means the item value exceeded case price
-   This is expected and normal - some users must win big items
-   Overall profit should still be positive due to probability distribution
